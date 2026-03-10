import re
from typing import Any, Dict, List, Optional, Set, Tuple

from .constants import REV_OBS_MAP
from .models import TypeNode
from .type_system import normalize_type_name, observed_typename


def cpp_escape_string(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
    )


def cpp_escape_char(value: str) -> str:
    ch = value[0] if value else "\0"
    if ch == "\\":
        return "'\\\\'"
    if ch == "'":
        return "'\\''"
    if ch == "\n":
        return "'\\n'"
    if ch == "\r":
        return "'\\r'"
    if ch == "\t":
        return "'\\t'"
    if ch == "\0":
        return "'\\0'"
    return f"'{ch}'"


def sanitize_identifier(value: str) -> str:
    sanitized = re.sub(r"\W+", "_", value)
    if not sanitized:
        sanitized = "type"
    if sanitized[0].isdigit():
        sanitized = "_" + sanitized
    return sanitized


def find_struct_name(
    struct_name: str, struct_fields: Dict[str, List[Tuple[str, str]]]
) -> Optional[str]:
    if struct_name in struct_fields:
        return struct_name
    lowered = struct_name.lower()
    for key in struct_fields:
        if key.lower() == lowered:
            return key
    return None


def detect_linked_list_fields(
    struct_name: str,
    struct_fields: Dict[str, List[Tuple[str, str]]],
) -> Optional[Tuple[str, str]]:
    actual_name = find_struct_name(struct_name, struct_fields)
    if actual_name is None:
        if struct_name.lower() == "listnode":
            return "val", "next"
        return None

    fields = struct_fields[actual_name]
    next_field = None
    value_field = None

    for field_name, field_type in fields:
        field_type_clean = normalize_type_name(field_type)
        if (
            next_field is None
            and field_name.lower() in {"next", "nxt"}
            and actual_name in field_type_clean
            and "*" in field_type
        ):
            next_field = field_name
        if value_field is None and field_name.lower() in {"val", "value", "data"}:
            value_field = field_name

    if next_field is None:
        for field_name, field_type in fields:
            field_type_clean = normalize_type_name(field_type)
            if actual_name in field_type_clean and "*" in field_type:
                next_field = field_name
                break

    if value_field is None:
        for field_name, field_type in fields:
            if field_name == next_field:
                continue
            if "*" not in field_type:
                value_field = field_name
                break

    if next_field and value_field:
        return value_field, next_field
    return None


def detect_tree_fields(
    struct_name: str,
    struct_fields: Dict[str, List[Tuple[str, str]]],
) -> Optional[Tuple[str, str, str]]:
    actual_name = find_struct_name(struct_name, struct_fields)
    if actual_name is None:
        if struct_name.lower() == "treenode":
            return "val", "left", "right"
        return None

    fields = struct_fields[actual_name]
    left_field = None
    right_field = None
    value_field = None

    for field_name, field_type in fields:
        field_type_clean = normalize_type_name(field_type)
        if (
            left_field is None
            and field_name.lower() in {"left", "l"}
            and actual_name in field_type_clean
            and "*" in field_type
        ):
            left_field = field_name
        if (
            right_field is None
            and field_name.lower() in {"right", "r"}
            and actual_name in field_type_clean
            and "*" in field_type
        ):
            right_field = field_name
        if value_field is None and field_name.lower() in {"val", "value", "data"}:
            value_field = field_name

    pointer_fields = [
        field_name
        for field_name, field_type in fields
        if actual_name in normalize_type_name(field_type) and "*" in field_type
    ]
    if left_field is None and pointer_fields:
        left_field = pointer_fields[0]
    if right_field is None and len(pointer_fields) > 1:
        right_field = pointer_fields[1]

    if value_field is None:
        for field_name, field_type in fields:
            if field_name in {left_field, right_field}:
                continue
            if "*" not in field_type:
                value_field = field_name
                break

    if left_field and right_field and value_field:
        return value_field, left_field, right_field
    return None


def build_pointer_helpers(
    required_helpers: Set[Tuple[str, str]],
    struct_fields: Dict[str, List[Tuple[str, str]]],
) -> str:
    helper_blocks: List[str] = []

    for helper_kind, struct_name in sorted(required_helpers):
        if helper_kind == "list":
            fields = detect_linked_list_fields(struct_name, struct_fields)
            if not fields:
                continue
            value_field, next_field = fields
            helper_id = sanitize_identifier(struct_name)
            helper_blocks.append(
                f"""
{struct_name}* __build_list_{helper_id}(const std::vector<int>& values) {{
    if (values.empty()) return nullptr;
    {struct_name}* head = nullptr;
    {struct_name}* tail = nullptr;
    for (int value : values) {{
        {struct_name}* node = new {struct_name}();
        node->{value_field} = value;
        node->{next_field} = nullptr;
        if (head == nullptr) {{
            head = node;
        }} else {{
            tail->{next_field} = node;
        }}
        tail = node;
    }}
    return head;
}}
"""
            )
        elif helper_kind == "tree":
            fields = detect_tree_fields(struct_name, struct_fields)
            if not fields:
                continue
            value_field, left_field, right_field = fields
            helper_id = sanitize_identifier(struct_name)
            helper_blocks.append(
                f"""
{struct_name}* __build_tree_{helper_id}(const std::vector<std::string>& values) {{
    if (values.empty() || values[0] == "null") return nullptr;

    auto parse_value = [](const std::string& token) -> int {{
        return std::stoi(token);
    }};

    {struct_name}* root = new {struct_name}();
    root->{value_field} = parse_value(values[0]);
    root->{left_field} = nullptr;
    root->{right_field} = nullptr;

    std::queue<{struct_name}*> q;
    q.push(root);

    size_t idx = 1;
    while (!q.empty() && idx < values.size()) {{
        {struct_name}* current = q.front();
        q.pop();

        if (idx < values.size() && values[idx] != "null") {{
            current->{left_field} = new {struct_name}();
            current->{left_field}->{value_field} = parse_value(values[idx]);
            current->{left_field}->{left_field} = nullptr;
            current->{left_field}->{right_field} = nullptr;
            q.push(current->{left_field});
        }}
        idx++;

        if (idx < values.size() && values[idx] != "null") {{
            current->{right_field} = new {struct_name}();
            current->{right_field}->{value_field} = parse_value(values[idx]);
            current->{right_field}->{left_field} = nullptr;
            current->{right_field}->{right_field} = nullptr;
            q.push(current->{right_field});
        }}
        idx++;
    }}

    return root;
}}
"""
            )

    return "\n".join(block for block in helper_blocks if block.strip())


def cpp_literal(value: Any, node: TypeNode, structs: Dict[str, List[str]]) -> str:
    base = REV_OBS_MAP.get(node.name, node.name)

    if base in {"vector", "deque", "set", "multiset", "unordered_set"}:
        inner = node.args[0] if node.args else TypeNode("int")
        seq = value if isinstance(value, (list, tuple, set)) else [value]
        return "{" + ", ".join(cpp_literal(item, inner, structs) for item in seq) + "}"

    if base in {"map", "unordered_map"}:
        key_node = node.args[0] if len(node.args) >= 1 else TypeNode("int")
        val_node = node.args[1] if len(node.args) >= 2 else TypeNode("int")
        pairs: List[Tuple[Any, Any]] = []

        if isinstance(value, dict):
            pairs = list(value.items())
        elif isinstance(value, (list, tuple)):
            for item in value:
                if isinstance(item, (list, tuple)) and len(item) == 2:
                    pairs.append((item[0], item[1]))

        return "{" + ", ".join(
            "{"
            + cpp_literal(k, key_node, structs)
            + ", "
            + cpp_literal(v, val_node, structs)
            + "}"
            for k, v in pairs
        ) + "}"

    if base == "pair":
        if isinstance(value, (list, tuple)) and len(value) == 2:
            left_node = node.args[0] if len(node.args) > 0 else TypeNode("int")
            right_node = node.args[1] if len(node.args) > 1 else TypeNode("int")
            return (
                "{"
                + cpp_literal(value[0], left_node, structs)
                + ", "
                + cpp_literal(value[1], right_node, structs)
                + "}"
            )
        return "{0, 0}"

    if base in structs:
        fields = structs[base]
        if isinstance(value, dict):
            values = [value.get(field, 0) for field in fields]
            return "{" + ", ".join(str(v) for v in values) + "}"
        if isinstance(value, (list, tuple)):
            return "{" + ", ".join(str(v) for v in value) + "}"
        return "{" + str(value) + "}"

    if base in {"string", "std::string"}:
        return '"' + cpp_escape_string(str(value)) + '"'

    if base in {"char", "signed char", "unsigned char"}:
        return cpp_escape_char(str(value))

    if base == "bool":
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, str):
            return "true" if value.lower() == "true" else "false"
        return "true" if bool(value) else "false"

    if isinstance(value, str):
        if re.fullmatch(r"[-+]?\d+", value):
            return value
        if re.fullmatch(r"[-+]?\d*\.\d+(e[-+]?\d+)?", value, re.IGNORECASE):
            return value
        return '"' + cpp_escape_string(value) + '"'

    if isinstance(value, bool):
        return "true" if value else "false"

    if value is None:
        return "0"

    return str(value)


def build_param_lines(
    name: str,
    node: TypeNode,
    value: Any,
    structs: Dict[str, List[str]],
    struct_fields: Dict[str, List[Tuple[str, str]]],
    required_helpers: Set[Tuple[str, str]],
) -> List[str]:
    base = REV_OBS_MAP.get(node.name, node.name)
    cpp_type = observed_typename(node)

    if node.pointer_depth > 0:
        actual_struct = find_struct_name(base, struct_fields) or base
        helper_id = sanitize_identifier(actual_struct)

        if detect_linked_list_fields(actual_struct, struct_fields):
            required_helpers.add(("list", actual_struct))
            if value is None:
                return [f"{cpp_type} {name} = nullptr;"]

            values_list = value if isinstance(value, (list, tuple)) else [value]
            int_values = [entry for entry in values_list if entry is not None]
            vector_literal = ", ".join(
                cpp_literal(item, TypeNode("int"), structs) for item in int_values
            )
            return [
                f"{cpp_type} {name} = __build_list_{helper_id}(std::vector<int>{{{vector_literal}}});"
            ]

        if detect_tree_fields(actual_struct, struct_fields):
            required_helpers.add(("tree", actual_struct))
            if value is None:
                return [f"{cpp_type} {name} = nullptr;"]

            tokens = value if isinstance(value, (list, tuple)) else [value]
            token_literals: List[str] = []
            for token in tokens:
                if token is None:
                    token_literals.append('"null"')
                    continue
                token_text = str(token)
                if token_text.lower() in {"null", "none", "nil"}:
                    token_literals.append('"null"')
                else:
                    token_literals.append('"' + cpp_escape_string(token_text) + '"')

            return [
                f"{cpp_type} {name} = __build_tree_{helper_id}(std::vector<std::string>{{{', '.join(token_literals)}}});"
            ]

        return [f"{cpp_type} {name} = nullptr;"]

    if base in {"queue", "stack", "priority_queue"}:
        inner = node.args[0] if node.args else TypeNode("int")
        sequence = value if isinstance(value, (list, tuple)) else [value]
        lines = [f"{cpp_type} {name};"]
        for item in sequence:
            lines.append(f"{name}.push({cpp_literal(item, inner, structs)});")
        return lines

    literal = cpp_literal(value, node, structs)
    return [f"{cpp_type} {name} = {literal};"]


def append_set_name_call(declaration: str, variable_name: str) -> str:
    if not variable_name:
        return declaration
    if f"{variable_name}.set_name(" in declaration:
        return declaration

    idx = declaration.rfind(";")
    if idx < 0:
        return declaration

    return (
        declaration[: idx + 1]
        + f' {variable_name}.set_name("{variable_name}");'
        + declaration[idx + 1 :]
    )
