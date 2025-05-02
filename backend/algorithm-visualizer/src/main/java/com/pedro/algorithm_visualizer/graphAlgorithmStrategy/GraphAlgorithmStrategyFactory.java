package com.pedro.algorithm_visualizer.graphAlgorithmStrategy;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.pedro.algorithm_visualizer.models.enums.AlgorithmEnum;
import com.pedro.algorithm_visualizer.repositories.AlgorithmRepository;

import jakarta.persistence.EntityNotFoundException;

@Component
public class GraphAlgorithmStrategyFactory {

    private AlgorithmRepository algorithmRepository;

    public GraphAlgorithmStrategyFactory(AlgorithmRepository algorithmRepository
    ) {
        this.algorithmRepository = algorithmRepository;
    }

    public GraphAlgorithmStrategy getAlgorithmStrategyInstance(UUID algorithmId) {
        
        AlgorithmEnum algorithmName = this.algorithmRepository.
        findById(algorithmId).orElseThrow(() -> new EntityNotFoundException()).getName();
        
        return switch (algorithmName) {
            case DFS -> new GraphDFSAlgorithmStrategy();
            case BFS -> new GraphBFSAlgorithmStrategy();
            case DIJKSTRA -> new GraphDijkstraAlgorithmStrategy();
            default -> throw new IllegalArgumentException("Not supported algorithm: " + algorithmName);
        };
    }
}
