package com.pedro.algorithm_visualizer.graphAlgorithmStrategy;

import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphAdjList;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.DTO.ExecutedNodesDTO;

public class GraphAlgorithm {

    private GraphAlgorithmStrategy graphAlgorithmStrategy;

    public void setStrategy(GraphAlgorithmStrategy strategy) {
        this.graphAlgorithmStrategy = strategy;
    }

    public ExecutedNodesDTO run(GraphAdjList graphAdjList) {
        return this.graphAlgorithmStrategy.run(graphAdjList);
    }
}
