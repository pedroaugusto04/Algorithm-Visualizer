#pragma once
#include <iostream>
#include <fstream>
#include <vector>
#include <deque>
#include <array>
#include <forward_list>
#include <list>
#include <map>
#include <set>
#include <stack>
#include <queue>
#include <unordered_map>
#include <unordered_set>
#include <string>
#include <type_traits>
#include <algorithm>
#include <typeinfo>
#include <utility>
#include <cstddef>
#include <cmath>
#include <cstdlib>
#include <bitset>
#include <tuple>

static constexpr size_t MAX_EVENT_BYTES = 4 * 1024 * 1024;
// Upper bound for serialization work (bytes produced while checking for changes). Without it,
// statements that read a large container in a loop cost O(n) each and the run degrades to O(n^2).
static constexpr size_t MAX_SERIALIZATION_WORK_BYTES = 128 * 1024 * 1024;

static int __step = 1;
static size_t __event_bytes = 0;
static size_t __av_serialization_work = 0;
static bool __av_tracing_enabled = true;
static bool __visualization_incomplete = false;

// === Object Tracking Registry ===
struct __AvTrackedObject {
    std::string path;
    std::string lastSnapshot;
    std::string func;
    int frame = 0;
    int depth = 0;
    bool initialized = false;
};

static std::unordered_map<const void*, __AvTrackedObject> __av_registry;
static int __av_frame_seq = 0;
static int __av_depth = 0;
static std::string __av_current_func = "main";

static std::ofstream __event_file([] {
    const char* path = std::getenv("AV_EVENT_FILE");
    return std::ofstream(path ? path : "/work/events.jsonl", std::ios::out | std::ios::app);
}());

// Stops tracing for the rest of the run: snapshots become a single branch, so the program
// finishes at native speed and the events recorded so far are returned as a partial trace.
inline void __mark_visualization_incomplete(const std::string& reason) {
    __av_tracing_enabled = false;
    if (__visualization_incomplete) return;
    __visualization_incomplete = true;
    const char* path = std::getenv("AV_STATUS_FILE");
    if (path) {
        std::ofstream status(path, std::ios::out | std::ios::trunc);
        if (status) status << reason;
    }
}

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

inline void __log(const std::string& type, const std::string& path, const std::string& op,
                  const std::string& val, int line, int frame = 0,
                  const std::string& func = "", int depth = 0) {
    if (!__event_file) {
        __mark_visualization_incomplete("Não foi possível criar o arquivo de eventos de visualização.");
        return;
    }
    if (__event_bytes >= MAX_EVENT_BYTES) {
        __mark_visualization_incomplete("Limite de tamanho dos eventos de visualização atingido; o programa continuou sem registrar novos passos.");
        return;
    }

    const std::string event =
        "{\"schema\":\"av.event.v2\""
        ",\"time\":" + std::to_string(__step++)
        + ",\"type\":" + __json_string(type)
        + ",\"path\":" + __json_string(path)
        + ",\"op\":" + __json_string(op)
        + ",\"line\":" + std::to_string(line)
        + ",\"frame\":" + std::to_string(frame)
        + ",\"func\":" + __json_string(func.empty() ? __av_current_func : func)
        + ",\"depth\":" + std::to_string(depth)
        + ",\"value\":" + val + "}";

    if (__event_bytes + event.size() + 1 > MAX_EVENT_BYTES) {
        __mark_visualization_incomplete("Limite de tamanho dos eventos de visualização atingido; o programa continuou sem registrar novos passos.");
        return;
    }
    __event_file << event << std::endl;
    __event_bytes += event.size() + 1;
}

// === Frame Guard ===
struct __AvFrameGuard {
    std::string prevFunc;
    int prevDepth;
    int frameId;
    __AvFrameGuard(const std::string& func) : prevFunc(__av_current_func), prevDepth(__av_depth) {
        frameId = ++__av_frame_seq;
        __av_depth++;
        __av_current_func = func;
    }
    ~__AvFrameGuard() {
        __av_depth--;
        __av_current_func = prevFunc;
    }
};

// === Scope Guard ===
template<typename T>
struct __AvScopeGuard {
    const void* ptr;
    std::string type;
    int line;

    __AvScopeGuard(const T& val, const std::string& path, const std::string& ty, int ln,
                   int frame, const std::string& func, int depth)
        : ptr(static_cast<const void*>(&val)), type(ty), line(ln) {
        __av_registry[ptr] = __AvTrackedObject{path, "", func, frame, depth, false};
    }

    ~__AvScopeGuard() {
        if (!__av_tracing_enabled) {
            __av_registry.erase(ptr);
            return;
        }
        auto it = __av_registry.find(ptr);
        if (it != __av_registry.end()) {
            const auto obj = it->second;
            __av_registry.erase(it);
            __log(type, obj.path, "exit", "null", line, obj.frame, obj.func, obj.depth);
        }
    }
};

template<typename T>
inline __AvScopeGuard<T> __av_make_scope_guard(
    const T& val,
    const std::string& path,
    const std::string& ty,
    int ln
) {
    return __AvScopeGuard<T>(val, path, ty, ln, __av_frame_seq, __av_current_func, __av_depth);
}
