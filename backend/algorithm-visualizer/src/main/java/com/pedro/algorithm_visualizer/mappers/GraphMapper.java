package com.pedro.algorithm_visualizer.mappers;

import org.springframework.stereotype.Component;

import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.GraphMapperStrategy;
import com.pedro.algorithm_visualizer.models.DTO.GraphDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.models.DataStructures.StructureType;
import com.pedro.algorithm_visualizer.models.User;

@Component
public class GraphMapper {

    private GraphMapperStrategy graphMapperStrategy;

    public void setStrategy(GraphMapperStrategy strategy) {
        this.graphMapperStrategy = strategy;
    }

    public Graph toGraph(GraphDTO graphDTO, User loggedUser, StructureType type) {
        if (this.graphMapperStrategy == null) {
            throw new IllegalStateException("Graph mapper strategy not found");
        }
        return this.graphMapperStrategy.toGraph(graphDTO, loggedUser,type);
    }

}
