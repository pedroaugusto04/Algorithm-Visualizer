package com.pedro.algorithm_visualizer.models.DTO;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ExecutionStage {
    COMPLETED("completed"), VALIDATION("validation"), INSTRUMENTATION("instrumentation"),
    COMPILATION("compilation"), EXECUTION("execution"), TELEMETRY("telemetry"), INTERNAL("internal");

    private final String value;
    ExecutionStage(String value) { this.value = value; }

    @JsonValue
    public String value() { return value; }
}
