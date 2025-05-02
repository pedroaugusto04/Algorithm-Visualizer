package com.pedro.algorithm_visualizer.models.ExecutionDataStructures;

import com.pedro.algorithm_visualizer.models.DTO.NodeDTO;

public class GraphPair {

    public GraphPair() {}

    public GraphPair(NodeDTO dst){
        this.dst = dst;
    }

    public GraphPair(NodeDTO dst, Integer weight) {
        this.dst = dst;
        this.weight = Long.valueOf(weight);
    }

    public GraphPair(NodeDTO dst, Long weight) {
        this.dst = dst;
        this.weight = weight;
    }

    NodeDTO dst; // nó destino
    Long weight; // peso caso exista

    public NodeDTO getNode() {
        return dst;
    }

    public void setNode(NodeDTO dst) {
        this.dst = dst;
    }

    public NodeDTO getDst() {
        return dst;
    }

    public void setDst(NodeDTO dst) {
        this.dst = dst;
    }

    public Long getWeight() {
        return weight;
    }

    public void setWeight(Long weight) {
        this.weight = weight;
    }
}
