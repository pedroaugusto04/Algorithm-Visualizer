from typing import Dict


OBS_MAP: Dict[str, str] = {
    "vector": "ObservedVector",
    "deque": "ObservedDeque",
    "map": "ObservedMap",
    "unordered_map": "ObservedUnorderedMap",
    "set": "ObservedSet",
    "multiset": "ObservedMultiSet",
    "unordered_set": "ObservedUnorderedSet",
    "queue": "ObservedQueue",
    "stack": "ObservedStack",
    "priority_queue": "ObservedPriorityQueue",
}

OBS_WRAPPER_SET = set(OBS_MAP.values())
REV_OBS_MAP = {value: key for key, value in OBS_MAP.items()}
