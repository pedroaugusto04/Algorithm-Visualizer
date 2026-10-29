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
    const void* ptr = static_cast<const void*>(&value);
    auto it = __av_registry.find(ptr);
    if (it == __av_registry.end()) {
        it = __av_registry.emplace(ptr, __AvTrackedObject{path, "", __av_current_func, __av_frame_seq, __av_depth}).first;
    }
    __AvTrackedObject& obj = it->second;

    const std::string serialized = type == "array" ? __serialize_sequence(value) : __serialize(value);
    __av_serialization_work += serialized.size();
    if (__av_serialization_work > MAX_SERIALIZATION_WORK_BYTES) {
        __mark_visualization_incomplete("Limite de processamento da visualização atingido; o programa continuou sem registrar novos passos.");
        return;
    }
    if (obj.lastSnapshot.empty()) {
        obj.lastSnapshot = serialized;
        __log(type, obj.path, "init", serialized, line, obj.frame, obj.func.empty() ? __av_current_func : obj.func, obj.depth);
    } else if (obj.lastSnapshot != serialized) {
        obj.lastSnapshot = serialized;
        __log(type, obj.path, "snapshot", serialized, line, __av_frame_seq, __av_current_func, __av_depth);
    }
}
