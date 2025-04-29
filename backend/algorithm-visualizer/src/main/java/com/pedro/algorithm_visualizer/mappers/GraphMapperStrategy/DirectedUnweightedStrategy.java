package com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import com.pedro.algorithm_visualizer.models.DTO.GraphDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.models.Edge;
import com.pedro.algorithm_visualizer.models.Node;

public class DirectedUnweightedStrategy implements GraphMapperStrategy {

    public Graph toGraph(List<GraphDTO> graphDTO) {
        Graph graph = new Graph();
        List<Node> nodes = new ArrayList<>();
        List<Edge> edges = new ArrayList<>();
        
        HashMap<String,Node> nodeMap = new HashMap<>();

        for (GraphDTO graphInfo : graphDTO) {
            
            String text = graphInfo.text();
            String[] lines = text.split("\n");

            for (String line : lines) {
                String[] values = line.split(" ");
                if (values.length == 2) {
                    String node1Value = values[0];
                    String node2Value = values[1];

                    Node node1 = nodeMap.computeIfAbsent(node1Value, Node::new);
                    Node node2 = nodeMap.computeIfAbsent(node2Value, Node::new);

                    node1.setGraph(graph);
                    node2.setGraph(graph);

                    nodes.add(node1);
                    nodes.add(node2);

                    Edge edge = new Edge(node1, node2);

                    edges.add(edge);

                    edge.setGraph(graph);
                }
            }
        }

        graph.setNodes(nodes);
        graph.setEdges(edges);

        return graph;
    }
    
}
