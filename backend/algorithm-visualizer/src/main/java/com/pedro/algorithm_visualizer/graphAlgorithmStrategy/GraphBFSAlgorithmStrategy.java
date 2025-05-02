package com.pedro.algorithm_visualizer.graphAlgorithmStrategy;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

import com.pedro.algorithm_visualizer.models.DTO.NodeDTO;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.DTO.ExecutedNodesDTO;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphAdjList;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphPair;

public class GraphBFSAlgorithmStrategy implements GraphAlgorithmStrategy {

    @Override
    public ExecutedNodesDTO run(GraphAdjList graphAdjList) {
        
        HashMap<Integer, List<GraphPair>> graph = graphAdjList.getGraph();

        HashMap<Integer, List<NodeDTO>> executionMap = new HashMap<>();
        int currentTime = 1;

        Queue<NodeDTO> queue = new LinkedList<>();
        NodeDTO startNode = graphAdjList.getStartNode();

        // BFS
        HashSet<Integer> visited = new HashSet<>();
        queue.add(startNode);

        while (!queue.isEmpty()) {

            int level = queue.size();

            for (int i = 0; i < level; i++) {
                NodeDTO current = queue.poll();

                if (visited.contains(current.getValue())) continue;
                visited.add(current.getValue());

                executionMap.computeIfAbsent(currentTime, key -> new LinkedList<>()).add(current);

                if (!graph.containsKey(current.getValue()))
                    continue;

                for (GraphPair pair : graph.get(current.getValue())) {

                    NodeDTO node = pair.getNode();

                    queue.add(node);
                }
            }
            currentTime++;

        }

        ExecutedNodesDTO executedNodes = new ExecutedNodesDTO(executionMap);


        return executedNodes;
    }

}
