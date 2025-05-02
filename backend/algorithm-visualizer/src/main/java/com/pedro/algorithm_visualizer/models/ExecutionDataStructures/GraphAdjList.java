package com.pedro.algorithm_visualizer.models.ExecutionDataStructures;

import java.util.HashMap;
import java.util.List;

import com.pedro.algorithm_visualizer.models.DTO.NodeDTO;

public class GraphAdjList {

    private NodeDTO startNode;

    private HashMap<Integer,List<GraphPair>> graph;

    public GraphAdjList() {}

    public GraphAdjList(HashMap<Integer,List<GraphPair>> graph, NodeDTO startNode) {
        this.startNode = startNode;
        this.graph = graph;
    }

    public HashMap<Integer, List<GraphPair>> getGraph() {
        return graph;
    }

    public void setGraph(HashMap<Integer, List<GraphPair>> graph) {
        this.graph = graph;
    }

    public NodeDTO getStartNode() {
        return startNode;
    }

    public void setStartNode(NodeDTO startNode) {
        this.startNode = startNode;
    }
}
