#pragma once
#include <string>
#include <unordered_map>

inline std::string avObservedStlType(const std::string& name) {
    static const std::unordered_map<std::string, std::string> types = {
        {"vector", "array"},
        {"deque", "array"},
        {"list", "array"},
        {"forward_list", "array"},
        {"array", "array"},
        {"set", "array"},
        {"multiset", "array"},
        {"unordered_set", "array"},
        {"unordered_multiset", "array"},
        {"stack", "array"},
        {"queue", "array"},
        {"priority_queue", "array"},
        {"bitset", "array"},
        {"pair", "array"},
        {"tuple", "array"},
        {"map", "map"},
        {"multimap", "map"},
        {"unordered_map", "map"},
        {"unordered_multimap", "map"},
        {"basic_string<char>", "array"},
        {"C array", "array"},
    };
    const auto found = types.find(name);
    return found == types.end() ? std::string{} : found->second;
}
