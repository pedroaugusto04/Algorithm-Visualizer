package com.pedro.algorithm_visualizer.services;

import java.util.LinkedList;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.pedro.algorithm_visualizer.models.DTO.GraphDTO;
import com.pedro.algorithm_visualizer.models.DTO.GraphItemDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.repositories.GraphRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class GraphService {

    private GraphRepository graphRepository;

    GraphService(GraphRepository graphRepository) {
        this.graphRepository = graphRepository;
    }

    public void saveGraph(Graph graph) {
        this.graphRepository.save(graph);
    }

    public GraphDTO getGraphById(UUID graphId) {

        Graph graph = graphRepository.findById(graphId).orElseThrow(() -> new EntityNotFoundException());

        boolean isDirected = graph.isDirected();

        boolean isWeighted = graph.getEdges().get(0).getWeight() != null;

        GraphDTO graphDTO = new GraphDTO(graph.getId(), isDirected, isWeighted, new LinkedList<>());

        graph.getEdges().forEach(edge -> {

            String[] strEdges = edge.toFormattedString(isWeighted).split(" ");

            StringBuilder sb = new StringBuilder();

            sb.append(strEdges[0]).append(" ");

            sb.append(strEdges[1]);

            if (isWeighted) {
                sb.append(" ").append(strEdges[2]);
            }

            GraphItemDTO graphItemDTO = new GraphItemDTO(sb.toString());

            graphDTO.items().add(graphItemDTO);
        });

        return graphDTO;
    }
}
