package com.pedro.algorithm_visualizer.models;

import java.util.List;

import com.pedro.algorithm_visualizer.models.DataStructures.Graph;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

@Entity
public class Node {

    @Override
    public String toString() {
        return value;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String value;

    @ManyToOne
    @JoinColumn(name = "graph_id", nullable = false)
    private Graph graph;

    @OneToMany(mappedBy = "source", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Edge> sourceEdges;

    @OneToMany(mappedBy = "target", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Edge> targetgEdges;

    public Node(String value) {
        this.value = value;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Graph getGraph() {
        return graph;
    }

    public void setGraph(Graph graph) {
        this.graph = graph;
    }

    public List<Edge> getSourceEdges() {
        return sourceEdges;
    }

    public void setSourceEdges(List<Edge> sourceEdges) {
        this.sourceEdges = sourceEdges;
    }

    public List<Edge> getTargetgEdges() {
        return targetgEdges;
    }

    public void setTargetgEdges(List<Edge> targetgEdges) {
        this.targetgEdges = targetgEdges;
    }
}
