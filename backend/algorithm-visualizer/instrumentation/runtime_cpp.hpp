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

void __log(std::string type, std::string path, std::string op, std::string val) {
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

template <typename T, typename = void>
struct is_observable : std::false_type {};

template <typename T>
struct is_observable<T, std::void_t<decltype(std::declval<T>().override_identity("", ""))>> : std::true_type {};

template<typename T>
struct AssignmentProxy {
    T& ref;
    std::string path;

    AssignmentProxy(T& r, std::string p) : ref(r), path(p) {}

    operator T&() const { return ref; }
    operator const T&() const { return ref; }

    bool operator<(const T& other) const { return ref < other; }
    bool operator==(const T& other) const { return ref == other; }

    AssignmentProxy& operator=(const T& v) {
        ref = v;
        __log("array", path, "update", __serialize(v));
        return *this;
    }

    AssignmentProxy& operator=(const AssignmentProxy& other) {
        if (this != &other) {
            *this = static_cast<T>(other.ref);
        }
        return *this;
    }

    AssignmentProxy& operator+=(const T& v) { return *this = ref + v; }
    AssignmentProxy& operator-=(const T& v) { return *this = ref - v; }
    T operator++(int) { T old = ref; *this = ref + 1; return old; }
    T& operator++() { *this = ref + 1; return ref; }

    friend std::istream& operator>>(std::istream& is, AssignmentProxy<T> proxy) {
        is >> proxy.ref;
        __log("array", proxy.path, "update", __serialize(proxy.ref));
        return is;
    }
};

template<typename T>
void swap(AssignmentProxy<T> a, AssignmentProxy<T> b) {
    T temp = static_cast<T>(a);
    a = static_cast<T>(b);
    b = temp;
}

template<typename V>
struct MapAssignmentProxy {
    V& ref;
    std::string path;

    MapAssignmentProxy(V& r, std::string p) : ref(r), path(p) {}

    operator V&() { return ref; }
    operator const V&() const { return ref; }

    MapAssignmentProxy& operator=(const V& v) {
        ref = v;
        __log("map", path, "update", __serialize(v));
        return *this;
    }

    MapAssignmentProxy& operator=(const MapAssignmentProxy& other) {
        if (this != &other) {
            *this = static_cast<const V&>(other.ref);
        }
        return *this;
    }

    template<typename U>
    auto operator+=(const U& v) -> decltype(std::declval<V&>() += v, std::declval<MapAssignmentProxy&>()) {
        ref += v;
        __log("map", path, "update", __serialize(ref));
        return *this;
    }

    template<typename U>
    auto operator-=(const U& v) -> decltype(std::declval<V&>() -= v, std::declval<MapAssignmentProxy&>()) {
        ref -= v;
        __log("map", path, "update", __serialize(ref));
        return *this;
    }

    template<typename U>
    auto operator*=(const U& v) -> decltype(std::declval<V&>() *= v, std::declval<MapAssignmentProxy&>()) {
        ref *= v;
        __log("map", path, "update", __serialize(ref));
        return *this;
    }

    template<typename U>
    auto operator/=(const U& v) -> decltype(std::declval<V&>() /= v, std::declval<MapAssignmentProxy&>()) {
        ref /= v;
        __log("map", path, "update", __serialize(ref));
        return *this;
    }

    template<typename U>
    auto operator%=(const U& v) -> decltype(std::declval<V&>() %= v, std::declval<MapAssignmentProxy&>()) {
        ref %= v;
        __log("map", path, "update", __serialize(ref));
        return *this;
    }

    template<typename W = V>
    auto operator++() -> decltype(++std::declval<W&>(), std::declval<MapAssignmentProxy&>()) {
        ++ref;
        __log("map", path, "update", __serialize(ref));
        return *this;
    }

    template<typename W = V>
    auto operator++(int) -> decltype(std::declval<W&>()++, std::declval<W>()) {
        W old = ref;
        ref++;
        __log("map", path, "update", __serialize(ref));
        return old;
    }

    template<typename W = V>
    auto operator--() -> decltype(--std::declval<W&>(), std::declval<MapAssignmentProxy&>()) {
        --ref;
        __log("map", path, "update", __serialize(ref));
        return *this;
    }

    template<typename W = V>
    auto operator--(int) -> decltype(std::declval<W&>()--, std::declval<W>()) {
        W old = ref;
        ref--;
        __log("map", path, "update", __serialize(ref));
        return old;
    }

    V* operator->() { return &ref; }
    auto begin() { return ref.begin(); }
    auto end() { return ref.end(); }
};

template<typename T>
class ObservedVector;

template<typename T, typename RawIter>
struct ObservedIterator {
    RawIter current;
    ObservedVector<T>* container;

    using iterator_category = std::random_access_iterator_tag;
    using value_type = T;
    using difference_type = typename std::iterator_traits<RawIter>::difference_type;
    using pointer = T*;
    using reference = AssignmentProxy<T>;

    ObservedIterator(RawIter it, ObservedVector<T>* c) : current(it), container(c) {}

    operator RawIter() const { return current; }

    reference operator*() const {
        size_t idx = std::distance(container->begin_raw(), current);
        return AssignmentProxy<T>(*current, container->get_path() + "[" + std::to_string(idx) + "]");
    }

    reference operator[](difference_type n) const {
        return *(*this + n);
    }

    ObservedIterator& operator++() { ++current; return *this; }
    ObservedIterator operator++(int) { ObservedIterator tmp = *this; ++current; return tmp; }
    ObservedIterator& operator--() { --current; return *this; }
    ObservedIterator operator--(int) { ObservedIterator tmp = *this; --current; return tmp; }

    ObservedIterator& operator+=(difference_type n) { current += n; return *this; }
    ObservedIterator& operator-=(difference_type n) { current -= n; return *this; }
    ObservedIterator operator+(difference_type n) const { return ObservedIterator(current + n, container); }
    ObservedIterator operator-(difference_type n) const { return ObservedIterator(current - n, container); }
    friend ObservedIterator operator+(difference_type n, const ObservedIterator& it) { return it + n; }
    difference_type operator-(const ObservedIterator& other) const { return current - other.current; }

    bool operator==(const ObservedIterator& other) const { return current == other.current; }
    bool operator!=(const ObservedIterator& other) const { return current != other.current; }
    bool operator<(const ObservedIterator& other) const { return current < other.current; }
    bool operator>(const ObservedIterator& other) const { return current > other.current; }
    bool operator<=(const ObservedIterator& other) const { return current <= other.current; }
    bool operator>=(const ObservedIterator& other) const { return current >= other.current; }

    friend void iter_swap(ObservedIterator a, ObservedIterator b) {
        T temp = static_cast<T>(*a);
        *a = static_cast<T>(*b);
        *b = temp;
    }
};

template<typename T>
class ObservedVector : public std::vector<T> {
    std::string path = "internal";

public:
    using std::vector<T>::vector;
    using std::vector<T>::erase;
    using std::vector<T>::insert;

    ObservedVector() : path("internal") {}
    ObservedVector(const ObservedVector& other) : std::vector<T>(other), path(other.path) {}
    ObservedVector(std::string p) : path(std::move(p)) {
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void override_identity(std::string parent, std::string key) { path = parent + "[" + key + "]"; }

    void set_name(std::string p) {
        path = std::move(p);
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    auto begin_raw() { return std::vector<T>::begin(); }
    std::string get_path() const { return path; }

    auto begin() { return ObservedIterator<T, typename std::vector<T>::iterator>(std::vector<T>::begin(), this); }
    auto end() { return ObservedIterator<T, typename std::vector<T>::iterator>(std::vector<T>::end(), this); }

    void push_back(const T& v) {
        std::vector<T>::push_back(v);
        std::string idx = std::to_string(this->size() - 1);
        if constexpr (is_observable<T>::value) {
            const_cast<T&>(this->back()).override_identity(path, idx);
        }
        __log("array", path + "[" + idx + "]", "add", is_observable<T>::value ? __serialize(MIN_VALUE_INT) : __serialize(v));
    }

    template<typename... Args>
    decltype(auto) emplace_back(Args&&... args) {
        auto& ref = std::vector<T>::emplace_back(std::forward<Args>(args)...);
        std::string idx = std::to_string(this->size() - 1);
        if constexpr (is_observable<T>::value) {
            ref.override_identity(path, idx);
            __log("array", path + "[" + idx + "]", "add", __serialize(MIN_VALUE_INT));
        } else {
            __log("array", path + "[" + idx + "]", "add", __serialize(ref));
        }
        return ref;
    }

    auto insert(typename std::vector<T>::iterator pos, const T& value) {
        size_t idx = std::distance(std::vector<T>::begin(), pos);
        auto it = std::vector<T>::insert(pos, value);
        if constexpr (is_observable<T>::value) {
            it->override_identity(path, std::to_string(idx));
            __log("array", path + "[" + std::to_string(idx) + "]", "add", __serialize(MIN_VALUE_INT));
        } else {
            __log("array", path + "[" + std::to_string(idx) + "]", "add", __serialize(value));
        }
        return it;
    }

    auto erase(typename std::vector<T>::iterator pos) {
        size_t idx = std::distance(std::vector<T>::begin(), pos);
        __log("array", path + "[" + std::to_string(idx) + "]", "remove", __serialize(MIN_VALUE_INT));
        return std::vector<T>::erase(pos);
    }

    auto erase(typename std::vector<T>::iterator first, typename std::vector<T>::iterator last) {
        size_t start = std::distance(std::vector<T>::begin(), first);
        size_t count = std::distance(first, last);
        for (size_t i = 0; i < count; ++i) {
            __log("array", path + "[" + std::to_string(start + i) + "]", "remove", __serialize(MIN_VALUE_INT));
        }
        return std::vector<T>::erase(first, last);
    }

    void pop_back() {
        if (this->empty()) return;
        size_t idx = this->size() - 1;
        __log("array", path + "[" + std::to_string(idx) + "]", "remove", __serialize(MIN_VALUE_INT));
        std::vector<T>::pop_back();
    }

    auto operator[](size_t i) {
        std::string p = path + "[" + std::to_string(i) + "]";
        if constexpr (std::is_same_v<T, bool>) {
            __log("array", p, "access", __serialize(MIN_VALUE_INT));
            return std::vector<T>::operator[](i);
        } else if constexpr (is_observable<T>::value) {
            std::vector<T>::operator[](i).override_identity(path, std::to_string(i));
            return std::vector<T>::operator[](i);
        } else {
            return AssignmentProxy<T>(std::vector<T>::operator[](i), p);
        }
    }

    ObservedVector& operator=(const ObservedVector& other) {
        if (this != &other) {
            std::vector<T>::operator=(other);
            path = other.path;
        }
        return *this;
    }

    void assign(size_t n, const T& v) {
        std::vector<T>::assign(n, v);
        for (size_t i = 0; i < n; ++i) {
            __log("array", path + "[" + std::to_string(i) + "]", "add", __serialize(v));
        }
    }

    void clear() {
        for (size_t i = 0; i < this->size(); ++i) {
            __log("array", path + "[" + std::to_string(i) + "]", "remove", __serialize(MIN_VALUE_INT));
        }
        std::vector<T>::clear();
    }
};

template<typename K, typename V>
class ObservedMap : public std::map<K, V> {
    std::string path = "internal";

public:
    using std::map<K, V>::map;
    using std::map<K, V>::emplace;
    using std::map<K, V>::erase;
    using std::map<K, V>::insert;

    ObservedMap() : path("internal") {}
    ObservedMap(std::string p) : path(std::move(p)) {
        __log("map", path, "init", __serialize(MIN_VALUE_INT));
    }

    void override_identity(std::string parent, std::string key) { path = parent + "[" + key + "]"; }

    void set_name(std::string p) {
        path = std::move(p);
        __log("map", path, "init", __serialize(MIN_VALUE_INT));
    }

    auto operator[](const K& key) {
        std::string ks = __to_str(key);
        std::string full_path = path + "[" + ks + "]";
        bool existed = this->find(key) != this->end();
        V& val = std::map<K, V>::operator[](key);

        if (!existed) {
            __log("map", full_path, "add", __serialize(MIN_VALUE_INT));
        } else {
            __log("map", full_path, "access", __serialize(MIN_VALUE_INT));
        }

        if constexpr (is_observable<V>::value) {
            val.override_identity(path, ks);
            return (V&)val;
        } else {
            return MapAssignmentProxy<V>(val, full_path);
        }
    }

    std::pair<typename std::map<K, V>::iterator, bool> insert(const std::pair<K, V>& value) {
        auto result = std::map<K, V>::insert(value);
        std::string full_path = path + "[" + __to_str(value.first) + "]";
        if (result.second) {
            __log("map", full_path, "add", __serialize(value.second));
        } else {
            __log("map", full_path, "access", __serialize(MIN_VALUE_INT));
        }
        return result;
    }

    template<typename... Args>
    auto emplace(Args&&... args) {
        auto result = std::map<K, V>::emplace(std::forward<Args>(args)...);
        std::string full_path = path + "[" + __to_str(result.first->first) + "]";
        if (result.second) {
            __log("map", full_path, "add", __serialize(result.first->second));
        } else {
            __log("map", full_path, "access", __serialize(MIN_VALUE_INT));
        }
        return result;
    }

    template<typename M>
    std::pair<typename std::map<K, V>::iterator, bool> insert_or_assign(const K& key, M&& obj) {
        bool existed = this->find(key) != this->end();
        auto result = std::map<K, V>::insert_or_assign(key, std::forward<M>(obj));
        std::string full_path = path + "[" + __to_str(key) + "]";
        __log("map", full_path, existed ? "update" : "add", __serialize(result.first->second));
        return result;
    }

    template<typename... Args>
    std::pair<typename std::map<K, V>::iterator, bool> try_emplace(const K& key, Args&&... args) {
        auto result = std::map<K, V>::try_emplace(key, std::forward<Args>(args)...);
        std::string full_path = path + "[" + __to_str(key) + "]";
        if (result.second) {
            __log("map", full_path, "add", __serialize(result.first->second));
        } else {
            __log("map", full_path, "access", __serialize(MIN_VALUE_INT));
        }
        return result;
    }

    size_t erase(const K& key) {
        std::string full_path = path + "[" + __to_str(key) + "]";
        auto it = this->find(key);
        if (it != this->end()) {
            __log("map", full_path, "remove", __serialize(it->second));
            return std::map<K, V>::erase(key);
        }
        return 0;
    }

    void clear() {
        for (const auto& kv : *this) {
            __log("map", path + "[" + __to_str(kv.first) + "]", "remove", __serialize(kv.second));
        }
        std::map<K, V>::clear();
    }
};

template<typename K, typename V>
class ObservedUnorderedMap : public std::unordered_map<K, V> {
    std::string path = "internal";

public:
    using std::unordered_map<K, V>::unordered_map;
    using std::unordered_map<K, V>::emplace;
    using std::unordered_map<K, V>::erase;
    using std::unordered_map<K, V>::insert;

    ObservedUnorderedMap() : path("internal") {}
    ObservedUnorderedMap(std::string p) : path(std::move(p)) {
        __log("map", path, "init", __serialize(MIN_VALUE_INT));
    }

    void override_identity(std::string parent, std::string key) { path = parent + "[" + key + "]"; }

    void set_name(std::string p) {
        path = std::move(p);
        __log("map", path, "init", __serialize(MIN_VALUE_INT));
    }

    auto operator[](const K& key) {
        std::string ks = __to_str(key);
        std::string full_path = path + "[" + ks + "]";
        bool existed = this->find(key) != this->end();
        V& val = std::unordered_map<K, V>::operator[](key);

        if (!existed) {
            __log("map", full_path, "add", __serialize(MIN_VALUE_INT));
        } else {
            __log("map", full_path, "access", __serialize(MIN_VALUE_INT));
        }

        if constexpr (is_observable<V>::value) {
            val.override_identity(path, ks);
            return (V&)val;
        } else {
            return MapAssignmentProxy<V>(val, full_path);
        }
    }

    std::pair<typename std::unordered_map<K, V>::iterator, bool> insert(const std::pair<K, V>& value) {
        auto result = std::unordered_map<K, V>::insert(value);
        std::string full_path = path + "[" + __to_str(value.first) + "]";
        if (result.second) {
            __log("map", full_path, "add", __serialize(value.second));
        } else {
            __log("map", full_path, "access", __serialize(MIN_VALUE_INT));
        }
        return result;
    }

    template<typename... Args>
    auto emplace(Args&&... args) {
        auto result = std::unordered_map<K, V>::emplace(std::forward<Args>(args)...);
        std::string full_path = path + "[" + __to_str(result.first->first) + "]";
        if (result.second) {
            __log("map", full_path, "add", __serialize(result.first->second));
        } else {
            __log("map", full_path, "access", __serialize(MIN_VALUE_INT));
        }
        return result;
    }

    template<typename M>
    std::pair<typename std::unordered_map<K, V>::iterator, bool> insert_or_assign(const K& key, M&& obj) {
        bool existed = this->find(key) != this->end();
        auto result = std::unordered_map<K, V>::insert_or_assign(key, std::forward<M>(obj));
        std::string full_path = path + "[" + __to_str(key) + "]";
        __log("map", full_path, existed ? "update" : "add", __serialize(result.first->second));
        return result;
    }

    template<typename... Args>
    std::pair<typename std::unordered_map<K, V>::iterator, bool> try_emplace(const K& key, Args&&... args) {
        auto result = std::unordered_map<K, V>::try_emplace(key, std::forward<Args>(args)...);
        std::string full_path = path + "[" + __to_str(key) + "]";
        if (result.second) {
            __log("map", full_path, "add", __serialize(result.first->second));
        } else {
            __log("map", full_path, "access", __serialize(MIN_VALUE_INT));
        }
        return result;
    }

    size_t erase(const K& key) {
        std::string full_path = path + "[" + __to_str(key) + "]";
        auto it = this->find(key);
        if (it != this->end()) {
            __log("map", full_path, "remove", __serialize(it->second));
            return std::unordered_map<K, V>::erase(key);
        }
        return 0;
    }

    void clear() {
        std::vector<std::pair<std::string, std::string>> snapshot;
        snapshot.reserve(this->size());
        for (const auto& kv : *this) {
            snapshot.push_back({__to_str(kv.first), __serialize(kv.second)});
        }
        std::sort(
            snapshot.begin(),
            snapshot.end(),
            [](const auto& a, const auto& b) {
                if (a.first != b.first) {
                    return a.first < b.first;
                }
                return a.second < b.second;
            }
        );
        for (const auto& item : snapshot) {
            __log("map", path + "[" + item.first + "]", "remove", item.second);
        }
        std::unordered_map<K, V>::clear();
    }
};

template<typename T>
class ObservedDeque : public std::deque<T> {
    std::string path = "internal";

public:
    using std::deque<T>::deque;
    using std::deque<T>::erase;
    using std::deque<T>::insert;

    ObservedDeque() : path("internal") {}
    ObservedDeque(std::string p) : path(std::move(p)) {
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void override_identity(std::string parent, std::string key) { path = parent + "[" + key + "]"; }

    void set_name(std::string p) {
        path = std::move(p);
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    auto operator[](size_t i) {
        std::string p = path + "[" + std::to_string(i) + "]";
        if constexpr (std::is_same_v<T, bool>) {
            __log("array", p, "access", __serialize(MIN_VALUE_INT));
            return std::deque<T>::operator[](i);
        } else if constexpr (is_observable<T>::value) {
            std::deque<T>::operator[](i).override_identity(path, std::to_string(i));
            return std::deque<T>::operator[](i);
        } else {
            return AssignmentProxy<T>(std::deque<T>::operator[](i), p);
        }
    }

    void push_back(const T& value) {
        std::deque<T>::push_back(value);
        __log("array", path + "[" + std::to_string(this->size() - 1) + "]", "add", __serialize(value));
    }

    void push_front(const T& value) {
        std::deque<T>::push_front(value);
        __log("array", path + "[0]", "add", __serialize(value));
    }

    void pop_back() {
        if (this->empty()) return;
        __log("array", path + "[" + std::to_string(this->size() - 1) + "]", "remove", __serialize(MIN_VALUE_INT));
        std::deque<T>::pop_back();
    }

    void pop_front() {
        if (this->empty()) return;
        __log("array", path + "[0]", "remove", __serialize(MIN_VALUE_INT));
        std::deque<T>::pop_front();
    }

    auto insert(typename std::deque<T>::iterator pos, const T& value) {
        size_t idx = std::distance(std::deque<T>::begin(), pos);
        auto it = std::deque<T>::insert(pos, value);
        __log("array", path + "[" + std::to_string(idx) + "]", "add", __serialize(value));
        return it;
    }

    auto erase(typename std::deque<T>::iterator pos) {
        size_t idx = std::distance(std::deque<T>::begin(), pos);
        __log("array", path + "[" + std::to_string(idx) + "]", "remove", __serialize(MIN_VALUE_INT));
        return std::deque<T>::erase(pos);
    }

    void clear() {
        for (size_t i = 0; i < this->size(); ++i) {
            __log("array", path + "[" + std::to_string(i) + "]", "remove", __serialize(MIN_VALUE_INT));
        }
        std::deque<T>::clear();
    }
};

template<typename T>
class ObservedUnorderedSet : public std::unordered_set<T> {
    std::string path = "internal";

public:
    using std::unordered_set<T>::unordered_set;
    using std::unordered_set<T>::emplace;
    using std::unordered_set<T>::erase;
    using std::unordered_set<T>::insert;

    ObservedUnorderedSet() : path("internal") {}
    ObservedUnorderedSet(std::string p) : path(std::move(p)) {
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void set_name(std::string p) {
        path = std::move(p);
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    std::pair<typename std::unordered_set<T>::iterator, bool> insert(const T& value) {
        auto result = std::unordered_set<T>::insert(value);
        if (result.second) {
            __log("array", path, "add", __serialize(value));
        }
        return result;
    }

    template<typename... Args>
    std::pair<typename std::unordered_set<T>::iterator, bool> emplace(Args&&... args) {
        auto result = std::unordered_set<T>::emplace(std::forward<Args>(args)...);
        if (result.second) {
            __log("array", path, "add", __serialize(*result.first));
        }
        return result;
    }

    size_t erase(const T& value) {
        size_t erased = std::unordered_set<T>::erase(value);
        if (erased > 0) {
            __log("array", path, "remove", __serialize(value));
        }
        return erased;
    }

    void clear() {
        std::vector<std::string> snapshot;
        snapshot.reserve(this->size());
        for (const auto& value : *this) {
            snapshot.push_back(__serialize(value));
        }
        std::sort(snapshot.begin(), snapshot.end());
        for (const auto& serialized : snapshot) {
            __log("array", path, "remove", serialized);
        }
        std::unordered_set<T>::clear();
    }
};

template<typename T>
class ObservedSet : public std::set<T> {
    std::string path = "internal";

public:
    using std::set<T>::set;
    using std::set<T>::emplace;
    using std::set<T>::erase;
    using std::set<T>::insert;

    ObservedSet() : path("internal") {}
    ObservedSet(std::string p) : path(std::move(p)) {
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void set_name(std::string p) {
        path = std::move(p);
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    auto insert(const T& value) {
        auto result = std::set<T>::insert(value);
        if (result.second) {
            __log("array", path, "add", __serialize(value));
        }
        return result;
    }

    template<typename... Args>
    auto emplace(Args&&... args) {
        auto result = std::set<T>::emplace(std::forward<Args>(args)...);
        if (result.second) {
            __log("array", path, "add", __serialize(*result.first));
        }
        return result;
    }

    size_t erase(const T& value) {
        size_t erased = std::set<T>::erase(value);
        if (erased > 0) {
            __log("array", path, "remove", __serialize(value));
        }
        return erased;
    }

    void clear() {
        for (const auto& value : *this) {
            __log("array", path, "remove", __serialize(value));
        }
        std::set<T>::clear();
    }
};

template<typename T>
class ObservedMultiSet : public std::multiset<T> {
    std::string path = "internal";

public:
    using std::multiset<T>::multiset;
    using std::multiset<T>::emplace;
    using std::multiset<T>::erase;
    using std::multiset<T>::insert;

    ObservedMultiSet() : path("internal") {}
    ObservedMultiSet(std::string p) : path(std::move(p)) {
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void set_name(std::string p) {
        path = std::move(p);
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    auto insert(const T& value) {
        auto it = std::multiset<T>::insert(value);
        __log("array", path, "add", __serialize(value));
        return it;
    }

    template<typename... Args>
    auto emplace(Args&&... args) {
        auto it = std::multiset<T>::emplace(std::forward<Args>(args)...);
        __log("array", path, "add", __serialize(*it));
        return it;
    }

    size_t erase(const T& value) {
        size_t erased = std::multiset<T>::erase(value);
        for (size_t i = 0; i < erased; ++i) {
            __log("array", path, "remove", __serialize(value));
        }
        return erased;
    }

    void clear() {
        for (const auto& value : *this) {
            __log("array", path, "remove", __serialize(value));
        }
        std::multiset<T>::clear();
    }
};

template<typename T>
class ObservedQueue : public std::queue<T> {
    std::string path = "internal";

public:
    using std::queue<T>::queue;

    ObservedQueue() : path("internal") {}
    ObservedQueue(std::string p) : path(std::move(p)) {
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void set_name(std::string p) {
        path = std::move(p);
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void push(const T& value) {
        std::queue<T>::push(value);
        __log("array", path, "add", __serialize(value));
    }

    template<typename... Args>
    void emplace(Args&&... args) {
        std::queue<T>::emplace(std::forward<Args>(args)...);
        __log("array", path, "add", __serialize(MIN_VALUE_INT));
    }

    T& front() {
        __log("array", path, "access", __serialize(MIN_VALUE_INT));
        return std::queue<T>::front();
    }

    T& back() {
        __log("array", path, "access", __serialize(MIN_VALUE_INT));
        return std::queue<T>::back();
    }

    void pop() {
        __log("array", path, "remove", __serialize(MIN_VALUE_INT));
        std::queue<T>::pop();
    }
};

template<typename T>
class ObservedStack : public std::stack<T> {
    std::string path = "internal";

public:
    using std::stack<T>::stack;

    ObservedStack() : path("internal") {}
    ObservedStack(std::string p) : path(std::move(p)) {
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void set_name(std::string p) {
        path = std::move(p);
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void push(const T& value) {
        std::stack<T>::push(value);
        __log("array", path, "add", __serialize(value));
    }

    template<typename... Args>
    void emplace(Args&&... args) {
        std::stack<T>::emplace(std::forward<Args>(args)...);
        __log("array", path, "add", __serialize(MIN_VALUE_INT));
    }

    T& top() {
        __log("array", path, "access", __serialize(MIN_VALUE_INT));
        return std::stack<T>::top();
    }

    void pop() {
        std::stack<T>::pop();
        __log("array", path, "remove", __serialize(MIN_VALUE_INT));
    }
};

template<typename T, typename Container = std::vector<T>, typename Compare = std::less<typename Container::value_type>>
class ObservedPriorityQueue : public std::priority_queue<T, Container, Compare> {
    std::string path = "internal";

public:
    using std::priority_queue<T, Container, Compare>::priority_queue;

    ObservedPriorityQueue() : path("internal") {}
    ObservedPriorityQueue(std::string p) : path(std::move(p)) {
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void set_name(std::string p) {
        path = std::move(p);
        __log("array", path, "init", __serialize(MIN_VALUE_INT));
    }

    void push(const T& value) {
        std::priority_queue<T, Container, Compare>::push(value);
        __log("array", path, "add", __serialize(value));
    }

    template<typename... Args>
    void emplace(Args&&... args) {
        std::priority_queue<T, Container, Compare>::emplace(std::forward<Args>(args)...);
        __log("array", path, "add", __serialize(MIN_VALUE_INT));
    }

    const T& top() {
        __log("array", path, "access", __serialize(MIN_VALUE_INT));
        return std::priority_queue<T, Container, Compare>::top();
    }

    void pop() {
        std::priority_queue<T, Container, Compare>::pop();
        __log("array", path, "remove", __serialize(MIN_VALUE_INT));
    }
};
