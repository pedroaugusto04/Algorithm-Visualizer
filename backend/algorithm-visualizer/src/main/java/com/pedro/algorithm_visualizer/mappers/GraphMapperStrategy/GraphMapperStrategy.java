package com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy;

import com.pedro.algorithm_visualizer.models.DTO.GraphDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.models.User;

public interface GraphMapperStrategy {
    
    Graph toGraph(GraphDTO graphDTO, User loggedUser);
}