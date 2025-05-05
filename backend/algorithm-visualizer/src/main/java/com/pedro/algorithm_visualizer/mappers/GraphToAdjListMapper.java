package com.pedro.algorithm_visualizer.mappers;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import com.pedro.algorithm_visualizer.models.DTO.NodeDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.DirectedUnweightedGraph;
import com.pedro.algorithm_visualizer.models.DataStructures.DirectedWeightedGraph;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.models.Edge;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphAdjList;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphPair;


public class GraphToAdjListMapper {
    
    public static GraphAdjList convertToAdjacencyList(Graph graph) {

        // lowerNode para no padrao de inicio do algoritmo
        // higherNode para determinar o length do array ao realizar o algoritmo com base no maior numero de no possivel
        NodeDTO lowerNode = new NodeDTO(Integer.MAX_VALUE);
        NodeDTO higherNode = new NodeDTO(Integer.MAX_VALUE);

        boolean isDirected = (graph instanceof DirectedUnweightedGraph || graph instanceof DirectedWeightedGraph);

        if (!graph.getNodes().isEmpty()){
            lowerNode = new NodeDTO(graph.getNodes().get(0));
            higherNode = new NodeDTO(graph.getNodes().get(0));
        }

        HashMap<Integer,List<GraphPair>> map = new HashMap<>();

        for (Edge edge : graph.getEdges()){
            
            NodeDTO nodeSrc = new NodeDTO(edge.getSource());
            
            Integer src = nodeSrc.getValue();

            if (src < lowerNode.getValue()){
                lowerNode = nodeSrc;
            }

            if (src > higherNode.getValue()) {
                higherNode = nodeSrc;
            }
            
            NodeDTO nodeDst = new NodeDTO(edge.getTarget());

            Integer dst = nodeDst.getValue();

            if (dst > higherNode.getValue()) {
                higherNode = nodeDst;
            }
            
            Long weight = edge.getWeight();


            GraphPair pairSrc = new GraphPair(nodeSrc,weight);
            GraphPair pairDst = new GraphPair(nodeDst,weight);

            if (map.containsKey(src)){
                map.get(src).add(pairDst);
            } else {
                List<GraphPair> list = new LinkedList<>();
                list.add(pairDst);
                map.put(src,list);
            }

            if (!isDirected){
                if (map.containsKey(dst)){
                    map.get(dst).add(pairSrc);
                } else {
                    List<GraphPair> list = new LinkedList<>();
                    list.add(pairSrc);
                    map.put(dst,list);
                }
            }
        }
        
        GraphAdjList graphAdjList = new GraphAdjList(map,lowerNode,higherNode);

        return graphAdjList;
    }
}
