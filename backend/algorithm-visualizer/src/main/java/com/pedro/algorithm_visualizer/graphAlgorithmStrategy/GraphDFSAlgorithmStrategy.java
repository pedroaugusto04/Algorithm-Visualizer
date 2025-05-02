package com.pedro.algorithm_visualizer.graphAlgorithmStrategy;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import com.pedro.algorithm_visualizer.models.DTO.NodeDTO;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.DTO.ExecutedNodesDTO;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphAdjList;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphPair;

public class GraphDFSAlgorithmStrategy implements GraphAlgorithmStrategy{

    @Override
    public ExecutedNodesDTO run(GraphAdjList graphAdjList) {
        
        HashMap<Integer, List<GraphPair>> graph = graphAdjList.getGraph();

        HashMap<Integer, List<NodeDTO>> executionMap = new HashMap<>();

        NodeDTO startNode = graphAdjList.getStartNode();

        // DFS

        HashSet<Integer> visited = new HashSet<>();

        AtomicInteger currentTime = new AtomicInteger(1); // inteiro mutavel

        dfs(startNode,graph,currentTime,visited,executionMap);

        ExecutedNodesDTO executedNodes = new ExecutedNodesDTO(executionMap);
            
        return executedNodes;
    }

    public void dfs(NodeDTO current, HashMap<Integer,List<GraphPair>> graph,AtomicInteger currentTime, HashSet<Integer> visited,
    HashMap<Integer,List<NodeDTO>> executionMap){
        if (visited.contains(current.getValue())) return;
        visited.add(current.getValue());

        executionMap.computeIfAbsent(currentTime.getAndIncrement(), key -> new LinkedList<>()).add(current);

        if (!graph.containsKey(current.getValue())) return;

        for (GraphPair pair : graph.get(current.getValue())) {

            NodeDTO node = pair.getNode();

            dfs(node,graph,currentTime,visited,executionMap);
        }
    }
    
}
