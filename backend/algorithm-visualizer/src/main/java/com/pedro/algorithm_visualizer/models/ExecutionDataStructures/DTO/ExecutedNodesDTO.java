package com.pedro.algorithm_visualizer.models.ExecutionDataStructures.DTO;

import java.util.HashMap;
import java.util.List;

import com.pedro.algorithm_visualizer.models.DTO.NodeDTO;

/*
 * associa unidades de tempo com uma lista de nos,
 * de modo que eh possivel renderizar no front na ordem do algoritmo
 */
public record ExecutedNodesDTO(HashMap<Integer,List<NodeDTO>> executionMap) {}