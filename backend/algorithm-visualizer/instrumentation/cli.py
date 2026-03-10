import sys

from .core import instrument
from .libclang_config import configure_libclang


def main(argv=None):
    args = argv if argv is not None else sys.argv
    configure_libclang()
    try:
        if len(args) > 3:
            clang_std = args[4] if len(args) > 4 else "gnu++17"
            instrument(args[1], args[2], args[3], clang_std)
        else:
            sys.stderr.write(
                "Uso: python3 instrumenter.py arquivo.cpp testcase.txt nome_do_metodo [gnu++17|gnu++20|gnu++23]\n"
            )
            return 1
    except Exception:
        import traceback

        traceback.print_exc(file=sys.stderr)
        return 1
    return 0
