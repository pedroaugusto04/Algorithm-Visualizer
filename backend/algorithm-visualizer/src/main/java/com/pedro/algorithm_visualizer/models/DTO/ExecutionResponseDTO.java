package com.pedro.algorithm_visualizer.models.DTO;

import java.util.List;

/**
 * @param events    Visualization events. On execution failures (crash/timeout) this holds the partial
 *                  trace recorded until the failure; on other failure stages it is empty.
 * @param truncated True when tracing stopped early (budget reached, crash or timeout) and {@code events}
 *                  is a prefix of the full run.
 * @param warnings  Non-fatal, user-facing messages about the visualization (e.g. why tracing was truncated).
 */
public record ExecutionResponseDTO(
        String schema,
        boolean success,
        ExecutionStage stage,
        String stdout,
        String stderr,
        Integer exitCode,
        long durationMs,
        List<ExecutionEventDTO> events,
        ExecutionErrorDTO error,
        boolean truncated,
        List<String> warnings
) {
    public static final String SCHEMA = "av.execution.v1";

    public ExecutionResponseDTO {
        events   = events   == null ? List.of() : List.copyOf(events);
        warnings = warnings == null ? List.of() : List.copyOf(warnings);
        stdout   = stdout   == null ? "" : stdout;
        stderr   = stderr   == null ? "" : stderr;
        if (!SCHEMA.equals(schema))  throw new IllegalArgumentException("Unsupported execution response schema");
        if (stage == null)           throw new IllegalArgumentException("Execution stage is required");
        if (durationMs < 0)          throw new IllegalArgumentException("durationMs cannot be negative");
        if (success != (stage == ExecutionStage.COMPLETED))
            throw new IllegalArgumentException("Response success and stage are inconsistent");
        if (success  && error != null) throw new IllegalArgumentException("Successful response cannot include an error");
        if (!success && error == null) throw new IllegalArgumentException("Failed response must include an error");
    }
}
