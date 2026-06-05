#include <iostream>
#include <vector>
#include <deque>
#include <stack>
#include <queue>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <set>
#include <string>
#include <type_traits>
#include <algorithm>
#include <limits>
#include <typeinfo>
#include <utility>
#include <iterator>
#include <cstddef>
#include <cmath>

static constexpr int MIN_VALUE_INT = std::numeric_limits<int>::min();

static int __step = 1;

inline std::string __escape_json(const std::string& s) {
    std::string out;
    out.reserve(s.size() + 8);
    for (char ch : s) {
        unsigned char uch = static_cast<unsigned char>(ch);
        switch (ch) {
            case '\\': out += "\\\\"; break;
            case '"': out += "\\\""; break;
            case '\b': out += "\\b"; break;
            case '\f': out += "\\f"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:
                if (uch < 0x20) {
                    out += "\\u00";
                    const char* hex = "0123456789ABCDEF";
                    out += hex[(uch >> 4) & 0x0F];
                    out += hex[uch & 0x0F];
                } else {
                    out += ch;
                }
        }
    }
    return out;
}

inline std::string __json_string(const std::string& s) {
    return "\"" + __escape_json(s) + "\"";
}

template<typename T>
std::string __to_str(const T& val) {
    if constexpr (std::is_same_v<std::decay_t<T>, bool>) {
        return val ? "true" : "false";
    }
    else if constexpr (std::is_same_v<std::decay_t<T>, char>) {
        return std::string(1, val);
    }
    else if constexpr (std::is_arithmetic_v<T>) {
        return std::to_string(val);
    }
    else if constexpr (std::is_convertible_v<T, std::string>) {
        return static_cast<std::string>(val);
    }
    else {
        return "obj";
    }
}

inline void __log(std::string type, std::string path, std::string op, std::string val) {
    std::cout
        << "__AV_EVENT__"
        << "{\"schema\":\"av.v1\""
        << ",\"time\":" << __step++
        << ",\"type\":" << __json_string(type)
        << ",\"path\":" << __json_string(path)
        << ",\"op\":" << __json_string(op)
        << ",\"value\":" << val
        << "}" << std::endl;
}

// ===================== SERIALIZER =====================
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
    else {
        return __json_string(std::string("<") + typeid(T).name() + ">");
    }
}

template<typename T>
std::string __serialize(const std::vector<T>& v) {
    std::string out = "[";
    for (size_t i = 0; i < v.size(); i++) {
        out += __serialize(v[i]);
        if (i + 1 < v.size()) out += ", ";
    }
    out += "]";
    return out;
}

template<typename T>
std::string __serialize(const std::deque<T>& v) {
    std::string out = "[";
    for (size_t i = 0; i < v.size(); i++) {
        out += __serialize(v[i]);
        if (i + 1 < v.size()) out += ", ";
    }
    out += "]";
    return out;
}

template<typename A, typename B>
std::string __serialize(const std::pair<A, B>& p) {
    return "[" + __serialize(p.first) + ", " + __serialize(p.second) + "]";
}

template<typename T>
std::string __serialize(const std::set<T>& s) {
    std::string out = "[";
    bool first = true;
    for (const auto& value : s) {
        if (!first) out += ", ";
        first = false;
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T>
std::string __serialize(const std::multiset<T>& s) {
    std::string out = "[";
    bool first = true;
    for (const auto& value : s) {
        if (!first) out += ", ";
        first = false;
        out += __serialize(value);
    }
    out += "]";
    return out;
}

template<typename T>
std::string __serialize(const std::unordered_set<T>& s) {
    std::vector<std::string> items;
    items.reserve(s.size());
    for (const auto& value : s) {
        items.push_back(__serialize(value));
    }
    std::sort(items.begin(), items.end());

    std::string out = "[";
    for (size_t i = 0; i < items.size(); ++i) {
        if (i > 0) out += ", ";
        out += items[i];
    }
    out += "]";
    return out;
}

template<typename K, typename V>
std::string __serialize(const std::map<K, V>& m) {
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

template<typename K, typename V>
std::string __serialize(const std::unordered_map<K, V>& m) {
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

// ===================== PRINT =====================
template<typename T>
void __print(const T& v) {
    std::cout << __serialize(v);
}

// ===================== TELEMETRY HELPERS =====================
template<typename T>
inline void __av_log_init(const std::string& type, const std::string& name, const T& val) {
    __log(type, name, "init", __serialize(val));
}

template<typename T>
inline void __av_log_update(const std::string& type, const std::string& path, const T& val) {
    __log(type, path, "update", __serialize(val));
}

template<typename T>
inline void __av_log_add(const std::string& type, const std::string& path, const T& val) {
    __log(type, path, "add", __serialize(val));
}

inline void __av_log_remove(const std::string& type, const std::string& path) {
    __log(type, path, "remove", "-2147483648");
}

template<typename T>
inline void __av_log_remove(const std::string& type, const std::string& path, const T& val) {
    __log(type, path, "remove", __serialize(val));
}

inline void __av_log_clear(const std::string& type, const std::string& name) {
    __log(type, name, "clear", "null");
}
