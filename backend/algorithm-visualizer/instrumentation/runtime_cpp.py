from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def _load_cpp_runtime() -> str:
    header_path = Path(__file__).with_name("runtime_cpp.hpp")
    return header_path.read_text(encoding="utf-8")


CPP_LIBRARY = _load_cpp_runtime()
