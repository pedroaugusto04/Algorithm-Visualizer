package com.pedro.algorithm_visualizer.models.DTO;

import java.util.List;
import java.util.UUID;

public record GraphDTO(UUID id, boolean directed, boolean weighted, List<GraphItemDTO> items) {}