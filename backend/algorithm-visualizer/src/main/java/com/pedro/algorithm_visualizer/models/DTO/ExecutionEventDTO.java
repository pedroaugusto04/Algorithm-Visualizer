package com.pedro.algorithm_visualizer.models.DTO;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.databind.JsonNode;

public record ExecutionEventDTO(
        String schema,
        long time,
        ExecutionEventType type,
        String path,
        Operation op,
        int line,
        Integer frame,
        String func,
        Integer depth,
        JsonNode value
) {
    public static final String SCHEMA = "av.event.v2";

    public enum Operation {
        INIT("init"), SNAPSHOT("snapshot"), EXIT("exit");

        private final String value;
        Operation(String value) { this.value = value; }

        @JsonValue
        public String value() { return value; }

        @JsonCreator
        public static Operation fromValue(String value) {
            for (Operation operation : values()) if (operation.value.equals(value)) return operation;
            throw new IllegalArgumentException("Unsupported visualization operation: " + value);
        }
    }
}
