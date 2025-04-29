package com.pedro.algorithm_visualizer.mappers;

import java.util.List;

import org.springframework.stereotype.Component;

import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.GraphMapperStrategy;
import com.pedro.algorithm_visualizer.models.DTO.GraphDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;

@Component
public class GraphMapper {

    private GraphMapperStrategy graphMapperStrategy;


    public void setStrategy(GraphMapperStrategy strategy) {
        this.graphMapperStrategy = strategy;
    }

    public Graph toGraph(List<GraphDTO> graphDTO) {
        if (this.graphMapperStrategy == null) {
            throw new IllegalStateException("Graph mapper strategy not found");
        }
        return this.graphMapperStrategy.toGraph(graphDTO);
    }

}
