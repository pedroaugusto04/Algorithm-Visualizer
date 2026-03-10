import os

import clang.cindex


LIBCLANG_CANDIDATES = [
    "/usr/lib/llvm-18/lib/libclang.so.1",
]


def configure_libclang():
    for path in LIBCLANG_CANDIDATES:
        if os.path.exists(path):
            clang.cindex.Config.set_library_file(path)
            return path
    return None
