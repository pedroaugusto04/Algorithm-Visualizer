package com.pedro.algorithm_visualizer.models.DTO;

import java.time.LocalDateTime;

public record ProfileDTO(String name, String email, String photo, LocalDateTime createdAt, int graphsCreated, int matricesCreated) {}