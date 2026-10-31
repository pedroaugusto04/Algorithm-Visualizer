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

static constexpr size_t MAX_SERIALIZED_CONTAINER_ITEMS = 1000;

template<typename T, typename Allocator>
std::string __serialize(const std::vector<T, Allocator>& v) {
    const size_t limit = v.size() < MAX_SERIALIZED_CONTAINER_ITEMS ? v.size() : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::string out = "[";
    for (size_t i = 0; i < limit; i++) {
        out += __serialize(v[i]);
        if (i + 1 < limit) out += ", ";
    }
    out += "]";
    return out;
}

template<typename Allocator>
std::string __serialize(const std::vector<bool, Allocator>& values) {
    const size_t limit = values.size() < MAX_SERIALIZED_CONTAINER_ITEMS ? values.size() : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::string out = "[";
    for (size_t i = 0; i < limit; ++i) {
        if (i) out += ", ";
        out += values[i] ? "true" : "false";
    }
    out += "]";
    return out;
}

template<typename T, typename Allocator>
std::string __serialize(const std::deque<T, Allocator>& v) {
    const size_t limit = v.size() < MAX_SERIALIZED_CONTAINER_ITEMS ? v.size() : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::string out = "[";
    for (size_t i = 0; i < limit; i++) {
        out += __serialize(v[i]);
        if (i + 1 < limit) out += ", ";
    }
    out += "]";
    return out;
}

template<typename T, size_t N>
std::string __serialize(const std::array<T, N>& values) {
    const size_t limit = values.size() < MAX_SERIALIZED_CONTAINER_ITEMS ? values.size() : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::string out = "[";
    for (size_t i = 0; i < limit; i++) {
        out += __serialize(values[i]);
        if (i + 1 < limit) out += ", ";
    }
    out += "]";
    return out;
}

template<typename T, typename Allocator>
std::string __serialize(const std::list<T, Allocator>& values) {
    std::string out = "[";
    size_t count = 0;
    for (const auto& value : values) {
        if (count >= MAX_SERIALIZED_CONTAINER_ITEMS) break;
        if (count++) out += ", ";
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T, typename Allocator>
std::string __serialize(const std::forward_list<T, Allocator>& values) {
    std::string out = "[";
    size_t count = 0;
    for (const auto& value : values) {
        if (count >= MAX_SERIALIZED_CONTAINER_ITEMS) break;
        if (count++) out += ", ";
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T, size_t N>
std::string __serialize(const T (&values)[N]) {
    const size_t limit = N < MAX_SERIALIZED_CONTAINER_ITEMS ? N : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::string out = "[";
    for (size_t i = 0; i < limit; i++) {
        out += __serialize(values[i]);
        if (i + 1 < limit) out += ", ";
    }
    out += "]";
    return out;
}

template<typename T, typename Compare, typename Allocator>
std::string __serialize(const std::set<T, Compare, Allocator>& values) {
    std::string out = "[";
    size_t count = 0;
    for (const auto& value : values) {
        if (count >= MAX_SERIALIZED_CONTAINER_ITEMS) break;
        if (count++) out += ", ";
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T, typename Compare, typename Allocator>
std::string __serialize(const std::multiset<T, Compare, Allocator>& values) {
    std::string out = "[";
    size_t count = 0;
    for (const auto& value : values) {
        if (count >= MAX_SERIALIZED_CONTAINER_ITEMS) break;
        if (count++) out += ", ";
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T, typename Hash, typename Equal, typename Allocator>
std::string __serialize(const std::unordered_set<T, Hash, Equal, Allocator>& values) {
    const size_t limit = values.size() < MAX_SERIALIZED_CONTAINER_ITEMS ? values.size() : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::vector<std::string> items;
    items.reserve(limit);
    size_t count = 0;
    for (const auto& value : values) {
        if (count++ >= limit) break;
        items.push_back(__serialize(value));
    }
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
    const size_t limit = values.size() < MAX_SERIALIZED_CONTAINER_ITEMS ? values.size() : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::vector<std::string> items;
    items.reserve(limit);
    size_t count = 0;
    for (const auto& value : values) {
        if (count++ >= limit) break;
        items.push_back(__serialize(value));
    }
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
    size_t count = 0;
    while (!copy.empty() && count < MAX_SERIALIZED_CONTAINER_ITEMS) {
        if (count++) out += ", ";
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
    size_t count = 0;
    while (!copy.empty() && count < MAX_SERIALIZED_CONTAINER_ITEMS) {
        if (count++) out += ", ";
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
    size_t count = 0;
    while (!copy.empty() && count < MAX_SERIALIZED_CONTAINER_ITEMS) {
        if (count++) out += ", ";
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
    const size_t limit = N < MAX_SERIALIZED_CONTAINER_ITEMS ? N : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::string out = "[";
    for (size_t index = 0; index < limit; ++index) {
        if (index) out += ", ";
        out += value[index] ? "true" : "false";
    }
    out += "]";
    return out;
}

template<typename K, typename V, typename Compare, typename Allocator>
std::string __serialize(const std::map<K, V, Compare, Allocator>& m) {
    std::string out = "{";
    size_t count = 0;
    for (const auto& kv : m) {
        if (count >= MAX_SERIALIZED_CONTAINER_ITEMS) break;
        if (count++) out += ", ";
        out += __json_string(__to_str(kv.first)) + ": " + __serialize(kv.second);
    }
    out += "}";
    return out;
}

template<typename K, typename V, typename Compare, typename Allocator>
std::string __serialize(const std::multimap<K, V, Compare, Allocator>& m) {
    std::string out = "[";
    size_t count = 0;
    for (const auto& kv : m) {
        if (count >= MAX_SERIALIZED_CONTAINER_ITEMS) break;
        if (count++) out += ", ";
        out += "[" + __serialize(kv.first) + ", " + __serialize(kv.second) + "]";
    }
    out += "]";
    return out;
}

template<typename K, typename V, typename Hash, typename Equal, typename Allocator>
std::string __serialize(const std::unordered_map<K, V, Hash, Equal, Allocator>& m) {
    const size_t limit = m.size() < MAX_SERIALIZED_CONTAINER_ITEMS ? m.size() : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::vector<std::pair<std::string, std::string>> items;
    items.reserve(limit);
    size_t count = 0;
    for (const auto& kv : m) {
        if (count++ >= limit) break;
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
    const size_t limit = m.size() < MAX_SERIALIZED_CONTAINER_ITEMS ? m.size() : MAX_SERIALIZED_CONTAINER_ITEMS;
    std::vector<std::pair<std::string, std::string>> items;
    items.reserve(limit);
    size_t count = 0;
    for (const auto& kv : m) {
        if (count++ >= limit) break;
        items.push_back({__serialize(kv.first), __serialize(kv.second)});
    }
    std::sort(items.begin(), items.end());
    std::string out = "[";
    for (size_t i = 0; i < items.size(); ++i) {
        if (i) out += ", ";
        out += "[" + items[i].first + ", " + items[i].second + "]";
    }
    out += "]";
    return out;
}

