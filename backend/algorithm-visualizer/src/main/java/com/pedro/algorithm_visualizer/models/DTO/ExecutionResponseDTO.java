package com.pedro.algorithm_visualizer.models.DTO;

import java.util.List;

public record ExecutionResponseDTO(
        String schema,
        boolean success,
        ExecutionStage stage,
        String stdout,
        String stderr,
        Integer exitCode,
        long durationMs,
        List<ExecutionEventDTO> events,
        ExecutionErrorDTO error
) {
    public static final String SCHEMA = "av.execution.v1";

    public ExecutionResponseDTO {
        events = events == null ? List.of() : List.copyOf(events);
        stdout = stdout == null ? "" : stdout;
        stderr = stderr == null ? "" : stderr;
        if (!SCHEMA.equals(schema)) throw new IllegalArgumentException("Unsupported execution response schema");
        if (stage == null) throw new IllegalArgumentException("Execution stage is required");
        if (durationMs < 0) throw new IllegalArgumentException("durationMs cannot be negative");
        if (success != (stage == ExecutionStage.COMPLETED)) {
            throw new IllegalArgumentException("Response success and stage are inconsistent");
        }
        if (success && error != null) throw new IllegalArgumentException("Successful response cannot include an error");
        if (!success && error == null) throw new IllegalArgumentException("Failed response must include an error");
    }
}
