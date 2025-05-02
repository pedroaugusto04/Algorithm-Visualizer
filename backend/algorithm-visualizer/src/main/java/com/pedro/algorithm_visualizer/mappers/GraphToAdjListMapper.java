package com.pedro.algorithm_visualizer.mappers;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.models.Edge;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphAdjList;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphPair;
import com.pedro.algorithm_visualizer.models.Node;
import com.pedro.algorithm_visualizer.models.DTO.NodeDTO;


public class GraphToAdjListMapper {
    
    public static GraphAdjList convertToAdjacencyList(Graph graph) {

        NodeDTO lowerNode = new NodeDTO(Integer.MAX_VALUE);

        if (!graph.getNodes().isEmpty()){
            lowerNode = new NodeDTO(graph.getNodes().get(0));
        }

        HashMap<Integer,List<GraphPair>> map = new HashMap<>();


        for (Edge edge : graph.getEdges()){
            
            NodeDTO nodeSrc = new NodeDTO(edge.getSource());
            
            Integer src = nodeSrc.getValue();

            if (src < lowerNode.getValue()){
                lowerNode = nodeSrc;
            }
            
            NodeDTO nodeDst = new NodeDTO(edge.getTarget());
            
            Long weight = edge.getWeight();

            GraphPair pair = new GraphPair(nodeDst,weight);

            if (map.containsKey(src)){
                map.get(src).add(pair);
            } else {
                List<GraphPair> list = new LinkedList<>();
                list.add(pair);
                map.put(src,list);
            }
        }

        GraphAdjList graphAdjList = new GraphAdjList(map,lowerNode);

        return graphAdjList;
    }
}
