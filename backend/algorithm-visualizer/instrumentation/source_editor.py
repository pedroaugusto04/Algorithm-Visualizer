from typing import List, Optional

from .models import Replacement


def compute_line_offsets(content: str) -> List[int]:
    offsets = [0]
    for idx, ch in enumerate(content):
        if ch == "\n":
            offsets.append(idx + 1)
    return offsets


def loc_to_offset(location, line_offsets: List[int], source_len: int) -> Optional[int]:
    if location is None or location.line <= 0:
        return None
    line_idx = location.line - 1
    if line_idx < 0 or line_idx >= len(line_offsets):
        return None
    column_idx = max(location.column - 1, 0)
    return min(line_offsets[line_idx] + column_idx, source_len)


class SourceEditor:
    def __init__(self, source: str):
        self.source = source
        self.source_len = len(source)
        self.line_offsets = compute_line_offsets(source)
        self.replacements: List[Replacement] = []

    def to_offset(self, location) -> Optional[int]:
        return loc_to_offset(location, self.line_offsets, self.source_len)

    def add_replacement(self, start: Optional[int], end: Optional[int], text: str):
        if start is None or end is None:
            return
        if start < 0 or end < 0 or start > self.source_len or end > self.source_len:
            return
        if start > end:
            return
        self.replacements.append(Replacement(start=start, end=end, text=text))

    def apply(self) -> str:
        rewritten = self.source
        for replacement in sorted(
            self.replacements,
            key=lambda item: (item.start, item.end),
            reverse=True,
        ):
            rewritten = (
                rewritten[: replacement.start]
                + replacement.text
                + rewritten[replacement.end :]
            )
        return rewritten
