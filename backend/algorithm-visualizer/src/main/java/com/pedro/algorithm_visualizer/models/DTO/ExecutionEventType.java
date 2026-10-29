package com.pedro.algorithm_visualizer.models.DTO;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ExecutionEventType {
    ARRAY("array"), MAP("map");

    private final String value;
    ExecutionEventType(String value) { this.value = value; }

    @JsonValue
    public String value() { return value; }

    @JsonCreator
    public static ExecutionEventType fromValue(String value) {
        for (ExecutionEventType type : values()) if (type.value.equals(value)) return type;
        throw new IllegalArgumentException("Unsupported visualization structure type: " + value);
    }
}
