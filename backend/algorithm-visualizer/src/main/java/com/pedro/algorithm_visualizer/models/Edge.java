package com.pedro.algorithm_visualizer.models;

import com.pedro.algorithm_visualizer.models.DataStructures.Graph;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Edge {

    @Override
    public String toString() {
        return this.source.getValue() + "->" + this.target.getValue();
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "graph_id", nullable = false)
    private Graph graph;

    @ManyToOne
    @JoinColumn(name = "source_node_id", nullable = false)
    private Node source;

    @ManyToOne
    @JoinColumn(name = "target_node_id", nullable = false)
    private Node target;

    @Column(nullable = true)
    private Long weight;

    public Edge(Node source, Node target){
        this.source = source;
        this.target = target;
    }

    public Edge(Node source, Node target, Long weight){
        this.source = source;
        this.target = target;
        this.weight = weight;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Graph getGraph() {
        return graph;
    }

    public void setGraph(Graph graph) {
        this.graph = graph;
    }

    public Node getSource() {
        return source;
    }

    public void setSource(Node source) {
        this.source = source;
    }

    public Node getTarget() {
        return target;
    }

    public void setTarget(Node target) {
        this.target = target;
    }

    public Long getWeight() {
        return weight;
    }

    public void setWeight(Long weight) {
        this.weight = weight;
    }

    
}
