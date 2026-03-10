from dataclasses import dataclass, field
from typing import List


@dataclass
class TypeNode:
    name: str
    args: List["TypeNode"] = field(default_factory=list)
    pointer_depth: int = 0


@dataclass(order=True)
class Replacement:
    start: int
    end: int
    text: str
