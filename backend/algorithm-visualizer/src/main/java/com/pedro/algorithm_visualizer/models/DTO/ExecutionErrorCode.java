package com.pedro.algorithm_visualizer.models.DTO;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ExecutionErrorCode {
    VALIDATION_ERROR("validation_error"), INSTRUMENTATION_ERROR("instrumentation_error"),
    COMPILATION_ERROR("compilation_error"), EXECUTION_ERROR("execution_error"),
    TIMEOUT("timeout"), TELEMETRY_ERROR("telemetry_error"), INTERNAL_ERROR("internal_error");

    private final String value;
    ExecutionErrorCode(String value) { this.value = value; }

    @JsonValue
    public String value() { return value; }
}
