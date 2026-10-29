#pragma once
#include "runtime_serializers.hpp"
// ===================== TELEMETRY HELPERS =====================
inline std::string __serialize_sequence(const std::string& value) {
    std::string out = "[";
    for (size_t i = 0; i < value.size(); ++i) {
        if (i) out += ", ";
        out += __serialize(value[i]);
    }
    out += "]";
    return out;
}

template<typename T>
std::string __serialize_sequence(const T& value) {
    return __serialize(value);
}

template<typename T>
inline void __av_snapshot_if_changed(
    const std::string& type,
    const std::string& path,
    const T& value,
    int line
) {
    if (!__av_tracing_enabled) return;
    const std::string serialized = type == "array" ? __serialize_sequence(value) : __serialize(value);
    __av_serialization_work += serialized.size();
    if (__av_serialization_work > MAX_SERIALIZATION_WORK_BYTES) {
        __mark_visualization_incomplete("Limite de processamento da visualização atingido; o programa continuou sem registrar novos passos.");
        return;
    }
    const auto previous = __av_last_snapshots.find(path);
    if (previous == __av_last_snapshots.end()) {
        __av_last_snapshots.emplace(path, serialized);
        __log(type, path, "init", serialized, line);
    } else if (previous->second != serialized) {
        previous->second = serialized;
        __log(type, path, "snapshot", serialized, line);
    }
}
