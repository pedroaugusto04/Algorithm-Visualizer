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
#include <unordered_map>

static constexpr size_t MAX_EVENT_BYTES = 2 * 1024 * 1024;

static int __step = 1;
static size_t __event_bytes = 0;
static bool __visualization_incomplete = false;
static std::unordered_map<std::string, std::string> __av_last_snapshots;
static std::ofstream __event_file([] {
    const char* path = std::getenv("AV_EVENT_FILE");
    return std::ofstream(path ? path : "/work/events.jsonl", std::ios::out | std::ios::app);
}());

inline void __mark_visualization_incomplete(const std::string& reason) {
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

inline void __log(std::string type, std::string path, std::string op, std::string val, int line) {
    if (!__event_file) {
        __mark_visualization_incomplete("Não foi possível criar o arquivo de eventos de visualização.");
        return;
    }
    if (__event_bytes >= MAX_EVENT_BYTES) {
        __mark_visualization_incomplete("Limite de tamanho dos eventos de visualização atingido.");
        return;
    }

    const std::string event =
        "{\"schema\":\"av.event.v1\""
        ",\"time\":" + std::to_string(__step++)
        + ",\"type\":" + __json_string(type)
        + ",\"path\":" + __json_string(path)
        + ",\"op\":" + __json_string(op)
        + ",\"line\":" + std::to_string(line)
        + ",\"value\":" + val + "}";
    if (__event_bytes + event.size() + 1 > MAX_EVENT_BYTES) {
        __mark_visualization_incomplete("Limite de tamanho dos eventos de visualização atingido.");
        return;
    }
    __event_file << event << std::endl;
    __event_bytes += event.size() + 1;
}

