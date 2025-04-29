package com.pedro.algorithm_visualizer.services;

import org.springframework.stereotype.Service;

import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.repositories.GraphRepository;

@Service
public class GraphService {

    private GraphRepository graphRepository;
    
    GraphService(GraphRepository graphRepository) {
        this.graphRepository = graphRepository;
    }

    public void saveGraph(Graph graph)  {
        this.graphRepository.save(graph);
    }
}
