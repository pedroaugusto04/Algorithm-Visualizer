package com.pedro.algorithm_visualizer.models.DTO;

public record ExecutionErrorDTO(ExecutionErrorCode code, String message) {
    public ExecutionErrorDTO {
        if (code == null) throw new IllegalArgumentException("Error code is required");
        if (message == null || message.isBlank()) throw new IllegalArgumentException("Error message is required");
    }
}
