package com.pedro.algorithm_visualizer.graphAlgorithmStrategy;

import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphAdjList;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.DTO.ExecutedNodesDTO;

public interface GraphAlgorithmStrategy {

    public ExecutedNodesDTO run(GraphAdjList graphAdjList);
}