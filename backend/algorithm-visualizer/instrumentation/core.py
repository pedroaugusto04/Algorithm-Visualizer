import os
from collections import OrderedDict
from typing import Dict, List, Optional, Set, Tuple

import clang.cindex

from .cpp_codegen import (
    append_set_name_call,
    build_param_lines,
    build_pointer_helpers,
)
from .models import TypeNode
from .runtime_cpp import CPP_LIBRARY
from .source_editor import SourceEditor
from .testcase_parser import parse_testcase, resolve_argument_values
from .type_system import is_observed_candidate, parse_type, replace_stl_types


def _is_from_target_file(node, abs_path: str) -> bool:
    if node.location is None or node.location.file is None:
        return False
    return os.path.abspath(node.location.file.name) == abs_path


def _normalize_std_flag(clang_std: Optional[str]) -> str:
    value = (clang_std or "gnu++17").strip()
    if not value:
        return "-std=gnu++17"
    if value.startswith("-std="):
        return value
    if value.startswith("c++") or value.startswith("gnu++"):
        return f"-std={value}"
    return "-std=gnu++17"


def instrument(
    file_path: str,
    testcase_file: str,
    method_to_call: str,
    clang_std: str = "gnu++17",
):
    index = clang.cindex.Index.create()
    abs_path = os.path.abspath(file_path)
    tu = index.parse(abs_path, args=[_normalize_std_flag(clang_std)])

    with open(abs_path, "r", encoding="utf-8") as source_file:
        source = source_file.read()

    editor = SourceEditor(source)

    method_param_nodes: "OrderedDict[str, TypeNode]" = OrderedDict()
    method_param_order: List[str] = []
    structs: Dict[str, List[str]] = {}
    struct_fields: Dict[str, List[Tuple[str, str]]] = {}

    has_main = False
    method_name: Optional[str] = None
    method_return_type = "auto"

    def walk(node):
        nonlocal has_main, method_name, method_return_type

        if node.kind == clang.cindex.CursorKind.CXX_METHOD and node.spelling == method_to_call:
            parent = node.semantic_parent
            if parent and parent.spelling == "Solution":
                method_name = node.spelling
                method_return_type = node.result_type.spelling

                observable_args: List[str] = []
                for arg in node.get_arguments():
                    if not arg.spelling:
                        continue

                    arg_tnode = parse_type(arg.type)
                    method_param_nodes[arg.spelling] = arg_tnode
                    method_param_order.append(arg.spelling)

                    arg_start = editor.to_offset(arg.extent.start)
                    arg_end = editor.to_offset(arg.extent.end)
                    if arg_start is not None and arg_end is not None and arg_end >= arg_start:
                        arg_text = source[arg_start:arg_end]
                        rewritten_arg = replace_stl_types(arg_text)
                        if rewritten_arg != arg_text:
                            editor.add_replacement(arg_start, arg_end, rewritten_arg)

                    if is_observed_candidate(arg_tnode):
                        observable_args.append(arg.spelling)

                for child in node.get_children():
                    if child.kind == clang.cindex.CursorKind.COMPOUND_STMT and observable_args:
                        brace_offset = editor.to_offset(child.extent.start)
                        if brace_offset is not None:
                            injection = "\n" + "".join(
                                f'    {arg_name}.set_name("{arg_name}");\n'
                                for arg_name in observable_args
                            )
                            editor.add_replacement(brace_offset + 1, brace_offset + 1, injection)
                        break

        if node.kind == clang.cindex.CursorKind.FUNCTION_DECL and node.spelling == "main":
            has_main = True

        if _is_from_target_file(node, abs_path):
            if node.kind == clang.cindex.CursorKind.VAR_DECL and node.spelling:
                var_tnode = parse_type(node.type)
                if is_observed_candidate(var_tnode):
                    decl_start = editor.to_offset(node.extent.start)
                    decl_end = editor.to_offset(node.extent.end)
                    if decl_start is not None and decl_end is not None and decl_end >= decl_start:
                        declaration = source[decl_start:decl_end]
                        rewritten = replace_stl_types(declaration)
                        rewritten = append_set_name_call(rewritten, node.spelling)
                        if rewritten != declaration:
                            editor.add_replacement(decl_start, decl_end, rewritten)

        for child in node.get_children():
            walk(child)

    for node in tu.cursor.get_children():
        if node.kind == clang.cindex.CursorKind.STRUCT_DECL and node.is_definition():
            fields: List[str] = []
            detailed_fields: List[Tuple[str, str]] = []
            for field in node.get_children():
                if field.kind == clang.cindex.CursorKind.FIELD_DECL:
                    fields.append(field.spelling)
                    detailed_fields.append((field.spelling, field.type.spelling))
            structs[node.spelling] = fields
            struct_fields[node.spelling] = detailed_fields

    walk(tu.cursor)

    rewritten_source = editor.apply()

    print(CPP_LIBRARY)
    print(rewritten_source)

    if not has_main and method_name and os.path.exists(testcase_file):
        with open(testcase_file, "r", encoding="utf-8") as testcase_handle:
            testcase = testcase_handle.read().strip()

        named_params, positional_params = parse_testcase(testcase)
        resolved_values = resolve_argument_values(
            method_param_order,
            named_params,
            positional_params,
        )

        main_vars: List[str] = []
        required_helpers: Set[Tuple[str, str]] = set()
        for param_name in method_param_order:
            param_node = method_param_nodes.get(param_name, TypeNode("int"))
            main_vars.extend(
                build_param_lines(
                    param_name,
                    param_node,
                    resolved_values[param_name],
                    structs,
                    struct_fields,
                    required_helpers,
                )
            )

        helper_code = build_pointer_helpers(required_helpers, struct_fields)
        helper_code_block = helper_code + "\n" if helper_code else ""

        main_vars_code = "\n    ".join(main_vars)
        args_list = ", ".join(method_param_order)

        if method_return_type.strip() == "void":
            invocation_code = (
                f"sol.{method_name}({args_list});\n"
                "    std::cout << \"SystemLog: null\" << std::endl;"
            )
        else:
            invocation_code = (
                f"{method_return_type} result = sol.{method_name}({args_list});\n"
                "    std::cout << \"SystemLog: \";\n"
                "    __print(result);\n"
                "    std::cout << std::endl;"
            )

        main_code = f"""
{helper_code_block}
int main() {{
    Solution sol;
    {main_vars_code}

    {invocation_code}
    return 0;
}}
"""
        print(main_code)
