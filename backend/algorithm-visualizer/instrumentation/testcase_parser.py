import ast
import json
import re
from collections import OrderedDict
from typing import Any, Dict, List, Set, Tuple


def _split_top_level(text: str, delimiters: Set[str]) -> List[str]:
    parts: List[str] = []
    start = 0
    depth_round = 0
    depth_square = 0
    depth_curly = 0
    in_string = False
    quote_char = ""
    escape = False

    for idx, ch in enumerate(text):
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote_char:
                in_string = False
            continue

        if ch in {'"', "'"}:
            in_string = True
            quote_char = ch
            continue

        if ch == "(":
            depth_round += 1
        elif ch == ")":
            depth_round = max(depth_round - 1, 0)
        elif ch == "[":
            depth_square += 1
        elif ch == "]":
            depth_square = max(depth_square - 1, 0)
        elif ch == "{":
            depth_curly += 1
        elif ch == "}":
            depth_curly = max(depth_curly - 1, 0)

        if (
            depth_round == 0
            and depth_square == 0
            and depth_curly == 0
            and ch in delimiters
        ):
            parts.append(text[start:idx])
            start = idx + 1

    parts.append(text[start:])
    return parts


def _find_top_level(text: str, target: str) -> int:
    depth_round = 0
    depth_square = 0
    depth_curly = 0
    in_string = False
    quote_char = ""
    escape = False

    for idx, ch in enumerate(text):
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote_char:
                in_string = False
            continue

        if ch in {'"', "'"}:
            in_string = True
            quote_char = ch
            continue

        if ch == "(":
            depth_round += 1
        elif ch == ")":
            depth_round = max(depth_round - 1, 0)
        elif ch == "[":
            depth_square += 1
        elif ch == "]":
            depth_square = max(depth_square - 1, 0)
        elif ch == "{":
            depth_curly += 1
        elif ch == "}":
            depth_curly = max(depth_curly - 1, 0)

        if depth_round == 0 and depth_square == 0 and depth_curly == 0 and ch == target:
            return idx

    return -1


def _parse_value_token(token: str) -> Any:
    value = token.strip()
    if not value:
        return ""

    try:
        return json.loads(value)
    except Exception:
        pass

    py_style = re.sub(r"\btrue\b", "True", value, flags=re.IGNORECASE)
    py_style = re.sub(r"\bfalse\b", "False", py_style, flags=re.IGNORECASE)
    py_style = re.sub(r"\bnull\b", "None", py_style, flags=re.IGNORECASE)

    try:
        return ast.literal_eval(py_style)
    except Exception:
        pass

    if re.fullmatch(r"[-+]?\d+", value):
        return int(value)
    if re.fullmatch(r"[-+]?\d*\.\d+(e[-+]?\d+)?", value, re.IGNORECASE):
        return float(value)
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False

    return value


def _extract_input_section(raw: str) -> str:
    text = (raw or "").strip()
    if not text:
        return ""

    input_marker = re.search(r"(?is)\bInput\s*:\s*", text)
    if input_marker:
        text = text[input_marker.end() :].strip()

    trailing_sections = re.search(
        r"(?is)(?:^|\n|,\s*)(Output|Expected|Explanation|Constraints|Example)\s*:",
        text,
    )
    if trailing_sections:
        text = text[: trailing_sections.start()].strip()

    if text.startswith("```") and text.endswith("```"):
        text = text[3:-3].strip()

    return text


def parse_testcase(raw: str) -> Tuple["OrderedDict[str, Any]", List[Any]]:
    text = _extract_input_section(raw)

    named: "OrderedDict[str, Any]" = OrderedDict()
    positional: List[Any] = []

    if not text:
        return named, positional

    try:
        parsed_root = json.loads(text)
        if isinstance(parsed_root, dict):
            for key, value in parsed_root.items():
                named[str(key)] = value
            return named, positional
        if isinstance(parsed_root, list):
            return named, [parsed_root]
    except Exception:
        pass

    if text.startswith("{") and text.endswith("}"):
        parsed_object = _parse_value_token(text)
        if isinstance(parsed_object, dict):
            for key, value in parsed_object.items():
                named[str(key)] = value
            return named, positional

    for part in _split_top_level(text, {",", "\n"}):
        token = part.strip()
        if not token:
            continue

        eq_idx = _find_top_level(token, "=")
        if eq_idx < 0:
            colon_idx = _find_top_level(token, ":")
            if colon_idx > 0:
                left = token[:colon_idx].strip()
                if re.fullmatch(r"[A-Za-z_]\w*", left):
                    eq_idx = colon_idx

        if eq_idx > 0:
            name = token[:eq_idx].strip()
            value_text = token[eq_idx + 1 :].strip()
            if re.fullmatch(r"[A-Za-z_]\w*", name):
                named[name] = _parse_value_token(value_text)
            else:
                positional.append(_parse_value_token(token))
        else:
            positional.append(_parse_value_token(token))

    return named, positional


def resolve_argument_values(
    param_order: List[str],
    named: "OrderedDict[str, Any]",
    positional: List[Any],
) -> Dict[str, Any]:
    if (
        len(positional) == 1
        and isinstance(positional[0], list)
        and len(param_order) > 1
        and len(positional[0]) == len(param_order)
    ):
        positional = positional[0]

    resolved: Dict[str, Any] = {}
    positional_idx = 0

    for param_name in param_order:
        if param_name in named:
            resolved[param_name] = named[param_name]
        elif positional_idx < len(positional):
            resolved[param_name] = positional[positional_idx]
            positional_idx += 1
        else:
            raise Exception(f"Parametro '{param_name}' ausente no testcase")

    return resolved
