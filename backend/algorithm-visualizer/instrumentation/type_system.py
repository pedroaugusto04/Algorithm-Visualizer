import re
from typing import List

import clang.cindex

from .constants import OBS_MAP, OBS_WRAPPER_SET, REV_OBS_MAP
from .models import TypeNode


def _kind(name: str):
    return getattr(clang.cindex.TypeKind, name, None)


def _kind_in(kind, names: List[str]) -> bool:
    for name in names:
        current = _kind(name)
        if current is not None and kind == current:
            return True
    return False


def normalize_type_name(name: str) -> str:
    text = name.strip()
    text = re.sub(r"\bconst\b", "", text)
    text = text.replace("&", " ").replace("*", " ")
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^std::", "", text)

    if "basic_string" in text:
        return "string"
    if text == "long long int":
        return "long long"
    if text == "long unsigned int":
        return "unsigned long"
    if text == "long long unsigned int":
        return "unsigned long long"
    if text == "short unsigned int":
        return "unsigned short"
    if text == "char signed":
        return "signed char"
    if text == "char unsigned":
        return "unsigned char"

    return text


def parse_type(clang_type) -> TypeNode:
    kind = clang_type.kind

    if _kind_in(kind, ["TYPEDEF", "ELABORATED", "UNEXPOSED"]):
        canonical = clang_type.get_canonical()
        if canonical and canonical.kind != kind:
            return parse_type(canonical)

    if _kind_in(kind, ["LVALUEREFERENCE", "RVALUEREFERENCE"]):
        return parse_type(clang_type.get_pointee())

    if _kind_in(kind, ["POINTER"]):
        pointee = parse_type(clang_type.get_pointee())
        return TypeNode(pointee.name, pointee.args, pointee.pointer_depth + 1)

    if _kind_in(kind, ["CONSTANTARRAY", "INCOMPLETEARRAY"]):
        element_type = clang_type.get_array_element_type()
        return TypeNode("vector", [parse_type(element_type)])

    if clang_type.get_num_template_arguments() > 0:
        base = normalize_type_name(clang_type.spelling.split("<", 1)[0])
        args: List[TypeNode] = []
        for idx in range(clang_type.get_num_template_arguments()):
            arg = clang_type.get_template_argument_type(idx)
            if arg.kind == _kind("INVALID"):
                continue
            args.append(parse_type(arg))
        return TypeNode(base, args)

    primitive_kinds = [
        "BOOL",
        "CHAR_S",
        "SCHAR",
        "CHAR_U",
        "UCHAR",
        "SHORT",
        "USHORT",
        "INT",
        "UINT",
        "LONG",
        "ULONG",
        "LONGLONG",
        "ULONGLONG",
        "FLOAT",
        "DOUBLE",
        "LONGDOUBLE",
    ]
    if _kind_in(kind, primitive_kinds):
        return TypeNode(normalize_type_name(clang_type.spelling))

    if _kind_in(kind, ["RECORD"]):
        return TypeNode(normalize_type_name(clang_type.spelling))

    return TypeNode(normalize_type_name(clang_type.spelling))


def observed_typename(node: TypeNode) -> str:
    base_name = REV_OBS_MAP.get(node.name, node.name)
    name = OBS_MAP.get(base_name, base_name)
    if not node.args:
        return name + ("*" * node.pointer_depth)
    inner = ", ".join(observed_typename(arg) for arg in node.args)
    return f"{name}<{inner}>" + ("*" * node.pointer_depth)


def replace_stl_types(text: str) -> str:
    result = text
    for stl_name in sorted(OBS_MAP.keys(), key=len, reverse=True):
        result = re.sub(
            rf"\b(?:std::)?{re.escape(stl_name)}\b",
            OBS_MAP[stl_name],
            result,
        )
    return result


def is_observed_candidate(node: TypeNode) -> bool:
    return node.pointer_depth == 0 and (
        node.name in OBS_MAP or node.name in OBS_WRAPPER_SET
    )
