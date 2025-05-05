package com.pedro.algorithm_visualizer.graphAlgorithmStrategy;

import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.PriorityQueue;

import com.pedro.algorithm_visualizer.models.DTO.NodeDTO;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.DTO.ExecutedNodesDTO;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.DTO.ExecutedNodesDijkstraDTO;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphAdjList;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphPair;

public class GraphDijkstraAlgorithmStrategy implements GraphAlgorithmStrategy{

    class CustomComparator implements Comparator<GraphPair> {
        
        public int compare(GraphPair p1, GraphPair p2) {
            return Long.compare(p1.getWeight(),p2.getWeight());
        }
    }

    @Override
    public ExecutedNodesDTO run(GraphAdjList graphAdjList) {
        
        HashMap<Integer, List<GraphPair>> graph = graphAdjList.getGraph();

        HashMap<Integer, List<NodeDTO>> executionMap = new HashMap<>();
        
        HashMap<Integer,List<long[]>> executionDistances = new HashMap<>();

        NodeDTO startNode = graphAdjList.getStartNode();

        NodeDTO higherNode = graphAdjList.getHigherNode();

        int currentTime = 1;

        // DJIKSTRA

        PriorityQueue<GraphPair> heap = new PriorityQueue<>(new CustomComparator());

        long[] dist = new long[higherNode.getValue() + 1];


        for (int i = 0; i < dist.length; i++){
            if (i == startNode.getValue()) {
                dist[i] = 0;
                continue;
            }
            dist[i] = Long.MAX_VALUE;
        }

        heap.add(new GraphPair(startNode,0));

        while (!heap.isEmpty()){
            GraphPair current = heap.poll();
            long weight = current.getWeight();
            
            executionMap.computeIfAbsent(currentTime, key -> new LinkedList<>()).add(current.getDst());
            executionDistances.computeIfAbsent(currentTime, key -> new LinkedList<>()).add(Arrays.copyOf(dist,dist.length));
            currentTime++;

            if (!graph.containsKey(current.getNode().getValue())) continue;

            for (GraphPair node : graph.get(current.getNode().getValue())) {
                int nodeValue = node.getNode().getValue();
                long nodeWeight = node.getWeight();

                if (nodeWeight != Long.MAX_VALUE && weight + nodeWeight < dist[nodeValue]) {
                    dist[nodeValue] = weight + nodeWeight;
                    heap.add(new GraphPair(node.getDst(), dist[nodeValue]));
                }

            }

        }

        ExecutedNodesDTO executedNodes = new ExecutedNodesDijkstraDTO(executionMap,executionDistances);

        return executedNodes;
    }
    
}
