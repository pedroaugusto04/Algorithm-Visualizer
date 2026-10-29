import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "supported_types.json"
HEADER = ROOT / "native" / "supported_type_names.hpp"
DOC = ROOT / "SUPPORTED_CPP.md"
START = "<!-- generated-supported-types-start -->"
END = "<!-- generated-supported-types-end -->"


def outputs():
    types = json.loads(MANIFEST.read_text())
    entries = types
    header = "#pragma once\n#include <string>\n#include <unordered_map>\n\n"
    header += "inline std::string avObservedStlType(const std::string& name) {\n"
    header += "    static const std::unordered_map<std::string, std::string> types = {\n"
    header += "\n".join(f'        {{"{t["template"]}", "{t["visual_type"]}"}},' for t in entries)
    header += "\n    };\n    const auto found = types.find(name);\n"
    header += "    return found == types.end() ? std::string{} : found->second;\n}\n"
    labels = ", ".join(f'`{t["label"]}`' for t in types)
    section = f"{START}\n- {labels}.\n{END}"
    doc = DOC.read_text()
    before, marker, rest = doc.partition(START)
    if not marker or END not in rest:
        raise RuntimeError("SUPPORTED_CPP.md está sem os marcadores da lista gerada")
    _, _, after = rest.partition(END)
    return header, before + section + after


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    header, doc = outputs()
    if args.check:
        if not HEADER.exists() or HEADER.read_text() != header or DOC.read_text() != doc:
            raise SystemExit("Matriz de suporte desatualizada; execute generate_supported_types.py")
        return
    HEADER.write_text(header)
    DOC.write_text(doc)


if __name__ == "__main__":
    main()
