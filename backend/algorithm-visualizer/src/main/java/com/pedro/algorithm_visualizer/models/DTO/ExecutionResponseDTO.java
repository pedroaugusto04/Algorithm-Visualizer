package com.pedro.algorithm_visualizer.models.DTO;

public record ExecutionResponseDTO(
        boolean success,
        String executionLogs,
        String systemLogs,
        String error
) {}