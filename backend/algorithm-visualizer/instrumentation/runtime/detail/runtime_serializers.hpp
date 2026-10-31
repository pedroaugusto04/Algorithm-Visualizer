#pragma once
#include "runtime_core.hpp"
// ===================== SERIALIZER =====================
template<typename A, typename B>
std::string __serialize(const std::pair<A, B>& value);
template<typename... Values>
std::string __serialize(const std::tuple<Values...>& value);
template<size_t N>
std::string __serialize(const std::bitset<N>& value);

inline std::string __serialize(const std::string& s) {
    return __json_string(s);
}

inline std::string __serialize(const char* s) {
    return __json_string(s == nullptr ? "" : std::string(s));
}

inline std::string __serialize(char c) {
    return __json_string(std::string(1, c));
}

inline std::string __serialize(bool b) {
    return b ? "true" : "false";
}

template<typename T>
std::string __serialize(const T& v) {
    if constexpr (std::is_arithmetic_v<T>) {
        if constexpr (std::is_floating_point_v<T>) {
            if (!std::isfinite(v)) {
                return "null";
            }
        }
        return std::to_string(v);
    }
    else if constexpr (std::is_enum_v<T>) {
        return std::to_string(static_cast<long long>(v));
    }
    else {
        return __json_string(std::string("<") + typeid(T).name() + ">");
    }
}

template<typename T, typename Allocator>
std::string __serialize(const std::vector<T, Allocator>& v) {
    std::string out = "[";
    for (size_t i = 0; i < v.size(); i++) {
        out += __serialize(v[i]);
        if (i + 1 < v.size()) out += ", ";
    }
    out += "]";
    return out;
}

template<typename Allocator>
std::string __serialize(const std::vector<bool, Allocator>& values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); ++i) {
        if (i) out += ", ";
        out += values[i] ? "true" : "false";
    }
    out += "]";
    return out;
}

template<typename T, typename Allocator>
std::string __serialize(const std::deque<T, Allocator>& v) {
    std::string out = "[";
    for (size_t i = 0; i < v.size(); i++) {
        out += __serialize(v[i]);
        if (i + 1 < v.size()) out += ", ";
    }
    out += "]";
    return out;
}

template<typename T, size_t N>
std::string __serialize(const std::array<T, N>& values) {
    std::string out = "[";
    for (size_t i = 0; i < values.size(); i++) {
        out += __serialize(values[i]);
        if (i + 1 < values.size()) out += ", ";
    }
    out += "]";
    return out;
}

template<typename T, typename Allocator>
std::string __serialize(const std::list<T, Allocator>& values) {
    std::string out = "[";
    bool first = true;
    for (const auto& value : values) {
        if (!first) out += ", ";
        first = false;
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T, typename Allocator>
std::string __serialize(const std::forward_list<T, Allocator>& values) {
    std::string out = "[";
    bool first = true;
    for (const auto& value : values) {
        if (!first) out += ", ";
        first = false;
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T, size_t N>
std::string __serialize(const T (&values)[N]) {
    std::string out = "[";
    for (size_t i = 0; i < N; i++) {
        out += __serialize(values[i]);
        if (i + 1 < N) out += ", ";
    }
    out += "]";
    return out;
}

template<typename T, typename Compare, typename Allocator>
std::string __serialize(const std::set<T, Compare, Allocator>& values) {
    std::string out = "[";
    bool first = true;
    for (const auto& value : values) {
        if (!first) out += ", ";
        first = false;
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T, typename Compare, typename Allocator>
std::string __serialize(const std::multiset<T, Compare, Allocator>& values) {
    std::string out = "[";
    bool first = true;
    for (const auto& value : values) {
        if (!first) out += ", ";
        first = false;
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T, typename Hash, typename Equal, typename Allocator>
std::string __serialize(const std::unordered_set<T, Hash, Equal, Allocator>& values) {
    std::vector<std::string> items;
    items.reserve(values.size());
    for (const auto& value : values) items.push_back(__serialize(value));
    std::sort(items.begin(), items.end());
    std::string out = "[";
    for (size_t i = 0; i < items.size(); ++i) {
        if (i) out += ", ";
        out += items[i];
    }
    out += "]";
    return out;
}

template<typename T, typename Hash, typename Equal, typename Allocator>
std::string __serialize(const std::unordered_multiset<T, Hash, Equal, Allocator>& values) {
    std::vector<std::string> items;
    items.reserve(values.size());
    for (const auto& value : values) items.push_back(__serialize(value));
    std::sort(items.begin(), items.end());
    std::string out = "[";
    for (size_t i = 0; i < items.size(); ++i) {
        if (i) out += ", ";
        out += items[i];
    }
    out += "]";
    return out;
}

template<typename T, typename Container>
std::string __serialize(const std::stack<T, Container>& values) {
    auto copy = values;
    std::string out = "[";
    bool first = true;
    while (!copy.empty()) {
        if (!first) out += ", ";
        first = false;
        out += __serialize(copy.top());
        copy.pop();
    }
    out += "]";
    return out;
}

template<typename T, typename Container>
std::string __serialize(const std::queue<T, Container>& values) {
    auto copy = values;
    std::string out = "[";
    bool first = true;
    while (!copy.empty()) {
        if (!first) out += ", ";
        first = false;
        out += __serialize(copy.front());
        copy.pop();
    }
    out += "]";
    return out;
}

template<typename T, typename Container, typename Compare>
std::string __serialize(const std::priority_queue<T, Container, Compare>& values) {
    auto copy = values;
    std::string out = "[";
    bool first = true;
    while (!copy.empty()) {
        if (!first) out += ", ";
        first = false;
        out += __serialize(copy.top());
        copy.pop();
    }
    out += "]";
    return out;
}

template<typename A, typename B>
std::string __serialize(const std::pair<A, B>& p) {
    return "[" + __serialize(p.first) + ", " + __serialize(p.second) + "]";
}

template<typename Tuple, size_t... Index>
std::string __serialize_tuple(const Tuple& value, std::index_sequence<Index...>) {
    std::string out = "[";
    size_t emitted = 0;
    ((out += (emitted++ ? ", " : "") + __serialize(std::get<Index>(value))), ...);
    out += "]";
    return out;
}

template<typename... Values>
std::string __serialize(const std::tuple<Values...>& value) {
    return __serialize_tuple(value, std::index_sequence_for<Values...>{});
}

template<size_t N>
std::string __serialize(const std::bitset<N>& value) {
    std::string out = "[";
    for (size_t index = 0; index < N; ++index) {
        if (index) out += ", ";
        out += value[index] ? "true" : "false";
    }
    out += "]";
    return out;
}

template<typename K, typename V, typename Compare, typename Allocator>
std::string __serialize(const std::map<K, V, Compare, Allocator>& m) {
    std::string out = "{";
    bool first = true;
    for (const auto& kv : m) {
        if (!first) out += ", ";
        first = false;
        out += __json_string(__to_str(kv.first)) + ": " + __serialize(kv.second);
    }
    out += "}";
    return out;
}

template<typename K, typename V, typename Compare, typename Allocator>
std::string __serialize(const std::multimap<K, V, Compare, Allocator>& m) {
    std::string out = "[";
    size_t index = 0;
    for (const auto& kv : m) {
        if (index++) out += ", ";
        out += "[" + __serialize(kv.first) + ", " + __serialize(kv.second) + "]";
    }
    out += "]";
    return out;
}

template<typename K, typename V, typename Hash, typename Equal, typename Allocator>
std::string __serialize(const std::unordered_map<K, V, Hash, Equal, Allocator>& m) {
    std::vector<std::pair<std::string, std::string>> items;
    items.reserve(m.size());
    for (const auto& kv : m) {
        items.push_back({__to_str(kv.first), __serialize(kv.second)});
    }
    std::sort(
        items.begin(),
        items.end(),
        [](const auto& a, const auto& b) {
            if (a.first != b.first) {
                return a.first < b.first;
            }
            return a.second < b.second;
        }
    );

    std::string out = "{";
    for (size_t i = 0; i < items.size(); ++i) {
        if (i > 0) out += ", ";
        out += __json_string(items[i].first) + ": " + items[i].second;
    }
    out += "}";
    return out;
}

template<typename K, typename V, typename Hash, typename Equal, typename Allocator>
std::string __serialize(const std::unordered_multimap<K, V, Hash, Equal, Allocator>& m) {
    std::vector<std::pair<std::string, std::string>> items;
    items.reserve(m.size());
    for (const auto& kv : m) items.push_back({__serialize(kv.first), __serialize(kv.second)});
    std::sort(items.begin(), items.end());
    std::string out = "[";
    for (size_t i = 0; i < items.size(); ++i) {
        if (i) out += ", ";
        out += "[" + items[i].first + ", " + items[i].second + "]";
    }
    out += "]";
    return out;
}

