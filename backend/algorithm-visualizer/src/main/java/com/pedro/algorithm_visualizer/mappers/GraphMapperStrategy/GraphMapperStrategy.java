package com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy;

import java.util.List;

import com.pedro.algorithm_visualizer.models.DTO.GraphDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;

public interface GraphMapperStrategy {
    
    Graph toGraph(List<GraphDTO> graphDTO);
}