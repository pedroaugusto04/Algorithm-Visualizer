package com.pedro.algorithm_visualizer.models.ExecutionDataStructures.DTO;

import java.util.HashMap;
import java.util.List;

import com.pedro.algorithm_visualizer.models.DTO.NodeDTO;

public class ExecutedNodesDijkstraDTO extends ExecutedNodesDTO {

    private HashMap<Integer, List<long[]>> mapDistances;

    public ExecutedNodesDijkstraDTO(HashMap<Integer, List<NodeDTO>> executionMap,
            HashMap<Integer, List<long[]>> mapDistances) {
        super(executionMap);
        this.mapDistances = mapDistances;
    }

    public HashMap<Integer, List<long[]>> getMapDistances() {
        return mapDistances;
    }
}
