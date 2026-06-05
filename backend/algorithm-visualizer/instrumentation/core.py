import os
import re
from collections import OrderedDict
from typing import Dict, List, Optional, Set, Tuple, Any

import clang.cindex

from .cpp_codegen import (
    build_param_lines,
    build_pointer_helpers,
)
from .models import TypeNode
from .runtime_cpp import CPP_LIBRARY
from .source_editor import SourceEditor
from .testcase_parser import parse_testcase, resolve_argument_values
from .type_system import is_observed_candidate, parse_type, observed_typename


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


def _cursor_key(node) -> Tuple[int, int, int, int]:
    start = node.extent.start
    end = node.extent.end
    return (
        getattr(start, "line", -1),
        getattr(start, "column", -1),
        getattr(end, "line", -1),
        getattr(end, "column", -1),
    )


def _same_cursor(a, b) -> bool:
    return (
        a.kind == b.kind
        and a.spelling == b.spelling
        and _cursor_key(a) == _cursor_key(b)
    )


def _collect_solution_methods(root, abs_path: str, method_name: str):
    methods = []

    def walk_tree(node):
        if (
            node.kind == clang.cindex.CursorKind.CXX_METHOD
            and node.spelling == method_name
            and _is_from_target_file(node, abs_path)
        ):
            parent = node.semantic_parent
            if parent and parent.spelling == "Solution":
                methods.append(node)
        for child in node.get_children():
            walk_tree(child)

    walk_tree(root)
    methods.sort(key=_cursor_key)
    return methods


def _has_main_function(root, abs_path: str) -> bool:
    found = False

    def walk_tree(node):
        nonlocal found
        if found:
            return
        if (
            node.kind == clang.cindex.CursorKind.FUNCTION_DECL
            and node.spelling == "main"
            and _is_from_target_file(node, abs_path)
        ):
            found = True
            return
        for child in node.get_children():
            walk_tree(child)

    walk_tree(root)
    return found


def _validate_translation_unit(tu, abs_path: str) -> None:
    errors: List[str] = []
    for diagnostic in tu.diagnostics:
        if diagnostic.severity < clang.cindex.Diagnostic.Error:
            continue
        if diagnostic.location is not None and diagnostic.location.file is not None:
            if os.path.abspath(diagnostic.location.file.name) != abs_path:
                continue
        file_name = (
            diagnostic.location.file.name
            if diagnostic.location is not None and diagnostic.location.file is not None
            else abs_path
        )
        line = diagnostic.location.line if diagnostic.location is not None else 0
        column = diagnostic.location.column if diagnostic.location is not None else 0
        errors.append(f"{file_name}:{line}:{column}: {diagnostic.spelling}")

    if errors:
        details = "\n".join(f"- {entry}" for entry in errors[:8])
        raise Exception("Falha ao parsear C++ para instrumentacao:\n" + details)


# Helper to scan forward for the semicolon of the statement
def find_semicolon(source: str, offset: int) -> int:
    idx = offset
    while idx < len(source):
        if source[idx] == ";":
            return idx + 1
        idx += 1
    return offset


def get_visualizer_type(tnode: TypeNode) -> str:
    name = tnode.name.lower()
    if "map" in name:
        return "map"
    if "set" in name:
        return "set"
    return "array"


def resolve_observed_variable(node, observed_vars) -> Optional[Tuple[str, List[Any]]]:
    curr = node
    indices = []
    
    while True:
        if curr.kind == clang.cindex.CursorKind.DECL_REF_EXPR:
            var_name = curr.spelling
            if var_name in observed_vars:
                return var_name, list(reversed(indices))
            return None
        
        children = list(curr.get_children())
        
        if curr.kind == clang.cindex.CursorKind.ARRAY_SUBSCRIPT_EXPR:
            if len(children) >= 2:
                indices.append(children[1])
                curr = children[0]
                continue
        elif curr.kind == clang.cindex.CursorKind.CALL_EXPR:
            if curr.spelling == "operator[]" and len(children) >= 3:
                indices.append(children[2])
                curr = children[0]
                continue
            elif len(children) >= 2:
                indices.append(children[1])
                curr = children[0]
                continue
                
        break
        
    return None


def resolve_method_call(node, observed_vars) -> Optional[Tuple[str, List[Any], str, List[Any]]]:
    children = list(node.get_children())
    if len(children) < 1:
        return None
    member_expr = children[0]
    if member_expr.kind != clang.cindex.CursorKind.MEMBER_REF_EXPR:
        return None
    
    method_name = member_expr.spelling
    
    member_children = list(member_expr.get_children())
    if len(member_children) < 1:
        return None
    base_obj = member_children[0]
    
    res = resolve_observed_variable(base_obj, observed_vars)
    if res is None:
        return None
    var_name, indices = res
    
    args = children[1:]
    return var_name, indices, method_name, args


def get_node_key(node) -> Tuple[int, int, int]:
    return (node.extent.start.offset, node.extent.end.offset, node.kind.value)


def get_statement_ancestor(node, parent_map):
    curr = node
    visited = set()
    while get_node_key(curr) in parent_map:
        key = get_node_key(curr)
        if key in visited:
            break
        visited.add(key)
        parent = parent_map[key]
        if parent.kind in (
            clang.cindex.CursorKind.COMPOUND_STMT,
            clang.cindex.CursorKind.IF_STMT,
            clang.cindex.CursorKind.FOR_STMT,
            clang.cindex.CursorKind.WHILE_STMT,
            clang.cindex.CursorKind.DO_STMT
        ):
            return curr
        curr = parent
    return curr


def is_single_statement_body(stmt, parent_map) -> bool:
    parent = parent_map.get(get_node_key(stmt))
    if parent is None:
        return False
    if parent.kind in (
        clang.cindex.CursorKind.IF_STMT,
        clang.cindex.CursorKind.FOR_STMT,
        clang.cindex.CursorKind.WHILE_STMT,
        clang.cindex.CursorKind.DO_STMT
    ):
        if stmt.kind != clang.cindex.CursorKind.COMPOUND_STMT:
            return True
    return False


ASSIGNMENT_OPS = {"=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>="}


def get_binary_operator(node, source_str: str) -> Optional[str]:
    children = list(node.get_children())
    if len(children) < 2:
        return None
    lhs_end = children[0].extent.end.offset
    rhs_start = children[1].extent.start.offset
    middle_text = source_str[lhs_end:rhs_start]
    for op in sorted(ASSIGNMENT_OPS, key=len, reverse=True):
        if op in middle_text:
            return op
    return None


def instrument(
    file_path: str,
    testcase_file: str,
    method_to_call: str,
    clang_std: str = "gnu++17",
):
    index = clang.cindex.Index.create()
    abs_path = os.path.abspath(file_path)
    tu = index.parse(abs_path, args=[_normalize_std_flag(clang_std)])
    _validate_translation_unit(tu, abs_path)

    with open(abs_path, "r", encoding="utf-8") as source_file:
        source = source_file.read()

    editor = SourceEditor(source)

    method_param_nodes: "OrderedDict[str, TypeNode]" = OrderedDict()
    method_param_order: List[str] = []
    structs: Dict[str, List[str]] = {}
    struct_fields: Dict[str, List[Tuple[str, str]]] = {}

    has_main = _has_main_function(tu.cursor, abs_path)
    selected_method = None
    selected_method_name: Optional[str] = None
    method_return_type = "auto"

    method_name_clean = (method_to_call or "").strip()
    if not has_main:
        if not method_name_clean:
            raise Exception("Metodo alvo obrigatorio quando o codigo nao define main()")

        candidates = _collect_solution_methods(tu.cursor, abs_path, method_name_clean)
        if not candidates:
            raise Exception(
                f"Metodo '{method_name_clean}' nao encontrado em class Solution no arquivo alvo"
            )
        if len(candidates) > 1:
            signatures = []
            for cursor in candidates:
                args_text = ", ".join(arg.type.spelling for arg in cursor.get_arguments())
                signatures.append(
                    f"{cursor.spelling}({args_text}) at line {cursor.extent.start.line}"
                )
            raise Exception(
                "Sobrecarga ambigua para metodo alvo. Forneca codigo sem overload para a visualizacao:\n- "
                + "\n- ".join(signatures)
            )

        selected_method = candidates[0]
        selected_method_name = selected_method.spelling
        method_return_type = selected_method.result_type.spelling

    # Build parent relationships for statement scope wrapping
    parent_map = {}
    def build_parents(n, parent=None):
        if parent is not None:
            parent_map[get_node_key(n)] = parent
        for child in n.get_children():
            build_parents(child, n)

    build_parents(tu.cursor)

    observed_vars: Dict[str, TypeNode] = {}
    statement_annotations = {}

    def get_source_text(cursor):
        return source[cursor.extent.start.offset:cursor.extent.end.offset]

    def add_statement_annotation(stmt, mutations_before=None, mutations_after=None):
        stmt_key = get_node_key(stmt)
        if stmt_key not in statement_annotations:
            statement_annotations[stmt_key] = {
                "stmt_node": stmt,
                "mutations_before": [],
                "mutations_after": [],
                "needs_braces": False
            }
        if is_single_statement_body(stmt, parent_map):
            statement_annotations[stmt_key]["needs_braces"] = True
        if mutations_before:
            statement_annotations[stmt_key]["mutations_before"].append(mutations_before)
        if mutations_after:
            statement_annotations[stmt_key]["mutations_after"].append(mutations_after)

    # Walk parameters first to populate observed args
    if selected_method is not None:
        for arg in selected_method.get_arguments():
            if not arg.spelling:
                continue
            arg_tnode = parse_type(arg.type)
            method_param_nodes[arg.spelling] = arg_tnode
            method_param_order.append(arg.spelling)
            if is_observed_candidate(arg_tnode):
                observed_vars[arg.spelling] = arg_tnode

    def walk_mutations(node):
        if _is_from_target_file(node, abs_path):
            # 1. Local variable declaration
            if node.kind == clang.cindex.CursorKind.VAR_DECL and node.spelling:
                var_tnode = parse_type(node.type)
                if is_observed_candidate(var_tnode):
                    observed_vars[node.spelling] = var_tnode
                    stmt = get_statement_ancestor(node, parent_map)
                    vis_type = get_visualizer_type(var_tnode)
                    init_stmt = f' __av_log_init("{vis_type}", "{node.spelling}", {node.spelling});'
                    add_statement_annotation(stmt, mutations_after=init_stmt)

            # 2. Binary operator assignment
            elif node.kind == clang.cindex.CursorKind.BINARY_OPERATOR:
                op = get_binary_operator(node, source)
                if op is not None:
                    children = list(node.get_children())
                    lhs = children[0]
                    res = resolve_observed_variable(lhs, observed_vars)
                    if res is not None:
                        var_name, indices = res
                        vis_type = get_visualizer_type(observed_vars[var_name])
                        path_expr = f'std::string("{var_name}")'
                        for idx in indices:
                            idx_text = get_source_text(idx)
                            path_expr += f' + "[" + __to_str({idx_text}) + "]"'
                        stmt = get_statement_ancestor(node, parent_map)
                        log_stmt = f' __av_log_update("{vis_type}", {path_expr}, {get_source_text(lhs)});'
                        add_statement_annotation(stmt, mutations_after=log_stmt)

            # 3. Unary operator (increment/decrement)
            elif node.kind == clang.cindex.CursorKind.UNARY_OPERATOR:
                unary_text = get_source_text(node)
                if "++" in unary_text or "--" in unary_text:
                    children = list(node.get_children())
                    if len(children) >= 1:
                        sub_expr = children[0]
                        res = resolve_observed_variable(sub_expr, observed_vars)
                        if res is not None:
                            var_name, indices = res
                            vis_type = get_visualizer_type(observed_vars[var_name])
                            path_expr = f'std::string("{var_name}")'
                            for idx in indices:
                                idx_text = get_source_text(idx)
                                path_expr += f' + "[" + __to_str({idx_text}) + "]"'
                            stmt = get_statement_ancestor(node, parent_map)
                            log_stmt = f' __av_log_update("{vis_type}", {path_expr}, {get_source_text(sub_expr)});'
                            add_statement_annotation(stmt, mutations_after=log_stmt)

            # 4. Call expressions (swaps and member calls)
            elif node.kind == clang.cindex.CursorKind.CALL_EXPR:
                spelling = node.spelling
                if spelling in ("swap", "std::swap") or spelling.endswith("swap"):
                    children = list(node.get_children())
                    args = children[1:]
                    if len(args) == 2:
                        res1 = resolve_observed_variable(args[0], observed_vars)
                        res2 = resolve_observed_variable(args[1], observed_vars)
                        stmt = get_statement_ancestor(node, parent_map)
                        
                        if res1 is not None:
                            var_name, indices = res1
                            vis_type = get_visualizer_type(observed_vars[var_name])
                            path_expr = f'std::string("{var_name}")'
                            for idx in indices:
                                idx_text = get_source_text(idx)
                                path_expr += f' + "[" + __to_str({idx_text}) + "]"'
                            log_stmt = f' __av_log_update("{vis_type}", {path_expr}, {get_source_text(args[0])});'
                            add_statement_annotation(stmt, mutations_after=log_stmt)
                            
                        if res2 is not None:
                            var_name, indices = res2
                            vis_type = get_visualizer_type(observed_vars[var_name])
                            path_expr = f'std::string("{var_name}")'
                            for idx in indices:
                                idx_text = get_source_text(idx)
                                path_expr += f' + "[" + __to_str({idx_text}) + "]"'
                            log_stmt = f' __av_log_update("{vis_type}", {path_expr}, {get_source_text(args[1])});'
                            add_statement_annotation(stmt, mutations_after=log_stmt)
                else:
                    res = resolve_method_call(node, observed_vars)
                    if res is not None:
                        var_name, indices, method_name, args = res
                        vis_type = get_visualizer_type(observed_vars[var_name])
                        
                        base_path_expr = f'std::string("{var_name}")'
                        for idx in indices:
                            idx_text = get_source_text(idx)
                            base_path_expr += f' + "[" + __to_str({idx_text}) + "]"'
                        
                        base_text = var_name
                        if indices:
                            base_text = f'{var_name}'
                            for idx in indices:
                                base_text += f'[{get_source_text(idx)}]'
                        
                        stmt = get_statement_ancestor(node, parent_map)
                        
                        if method_name in ("push_back", "emplace_back") and len(args) >= 1:
                            idx_expr = f"{base_text}.size() - 1"
                            path_expr_with_idx = f'{base_path_expr} + "[" + __to_str({idx_expr}) + "]"'
                            log_stmt = f' __av_log_add("{vis_type}", {path_expr_with_idx}, {base_text}.back());'
                            add_statement_annotation(stmt, mutations_after=log_stmt)
                            
                        elif method_name in ("push", "emplace") and len(args) >= 1:
                            log_stmt = f' __av_log_add("{vis_type}", {base_path_expr}, decltype({base_text})::value_type{get_source_text(args[0])});'
                            add_statement_annotation(stmt, mutations_after=log_stmt)
                            
                        elif method_name == "pop":
                            log_stmt = f'__av_log_remove("{vis_type}", {base_path_expr}); '
                            add_statement_annotation(stmt, mutations_before=log_stmt)
                            
                        elif method_name == "pop_back":
                            idx_expr = f"{base_text}.size() - 1"
                            path_expr_with_idx = f'{base_path_expr} + "[" + __to_str({idx_expr}) + "]"'
                            log_stmt = f'__av_log_remove("{vis_type}", {path_expr_with_idx}); '
                            add_statement_annotation(stmt, mutations_before=log_stmt)
                            
                        elif method_name == "clear":
                            log_stmt = f' __av_log_clear("{vis_type}", {base_path_expr});'
                            add_statement_annotation(stmt, mutations_after=log_stmt)
                            
                        elif method_name == "insert" and len(args) == 1:
                            log_stmt = f' __av_log_add("{vis_type}", {base_path_expr}, decltype({base_text})::value_type{get_source_text(args[0])});'
                            add_statement_annotation(stmt, mutations_after=log_stmt)
                            
                        elif method_name == "insert" and len(args) >= 2:
                            pos_text = get_source_text(args[0])
                            val_text = get_source_text(args[1])
                            idx_expr = f"std::distance({base_text}.begin(), {pos_text})"
                            path_expr_with_idx = f'{base_path_expr} + "[" + __to_str({idx_expr}) + "]"'
                            log_stmt = f' __av_log_add("{vis_type}", {path_expr_with_idx}, {val_text});'
                            add_statement_annotation(stmt, mutations_after=log_stmt)
                            
                        elif method_name == "erase" and len(args) >= 1:
                            if len(args) == 1:
                                if vis_type in ("map", "set"):
                                    log_stmt = f' __av_log_remove("{vis_type}", {base_path_expr}, decltype({base_text})::key_type{get_source_text(args[0])});'
                                    add_statement_annotation(stmt, mutations_after=log_stmt)
                                else:
                                    pos_text = get_source_text(args[0])
                                    idx_expr = f"std::distance({base_text}.begin(), {pos_text})"
                                    path_expr_with_idx = f'{base_path_expr} + "[" + __to_str({idx_expr}) + "]"'
                                    log_stmt = f'__av_log_remove("{vis_type}", {path_expr_with_idx}); '
                                    add_statement_annotation(stmt, mutations_before=log_stmt)
                            elif len(args) == 2:
                                first_text = get_source_text(args[0])
                                last_text = get_source_text(args[1])
                                log_stmt = (
                                    f"for (auto __it = {first_text}; __it != {last_text}; ++__it) {{ "
                                    f'__av_log_remove("{vis_type}", {base_path_expr} + "[" + __to_str(std::distance({base_text}.begin(), __it)) + "]"); '
                                    f"}} "
                                )
                                add_statement_annotation(stmt, mutations_before=log_stmt)

        for child in node.get_children():
            walk_mutations(child)

    # Traverse target solution method structure first
    if selected_method is not None:
        # Walk target method body
        walk_mutations(selected_method)
    else:
        # Or entire file if main function is defined
        walk_mutations(tu.cursor)

    # Inject method parameters initialization if target method exists
    if selected_method is not None:
        for child in selected_method.get_children():
            if child.kind == clang.cindex.CursorKind.COMPOUND_STMT:
                brace_offset = editor.to_offset(child.extent.start)
                if brace_offset is not None:
                    init_code = ""
                    for arg_name, arg_tnode in observed_vars.items():
                        if arg_name in method_param_order:
                            vis_type = get_visualizer_type(arg_tnode)
                            init_code += f'\n    __av_log_init("{vis_type}", "{arg_name}", {arg_name});'
                    if init_code:
                        editor.add_replacement(brace_offset + 1, brace_offset + 1, init_code + "\n")
                break

    # Apply statement-level annotations
    for stmt_key, annot in statement_annotations.items():
        stmt = annot["stmt_node"]
        stmt_start = editor.to_offset(stmt.extent.start)
        stmt_end = editor.to_offset(stmt.extent.end)
        stmt_semi = find_semicolon(source, max(0, stmt_end - 1)) if stmt_end is not None else None
        
        if stmt_start is not None and stmt_semi is not None:
            before_code = "".join(annot["mutations_before"])
            after_code = "".join(annot["mutations_after"])
            
            if annot["needs_braces"]:
                before_code = "{ " + before_code
                after_code = after_code + " }"
                
            if before_code:
                editor.add_replacement(stmt_start, stmt_start, before_code)
            if after_code:
                editor.add_replacement(stmt_semi, stmt_semi, after_code)

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

    rewritten_source = editor.apply()

    print(CPP_LIBRARY)
    print(rewritten_source)

    if not has_main and selected_method_name and os.path.exists(testcase_file):
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
                f"sol.{selected_method_name}({args_list});\n"
                "    std::cout << \"SystemLog: null\" << std::endl;"
            )
        else:
            invocation_code = (
                f"{method_return_type} result = sol.{selected_method_name}({args_list});\n"
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
