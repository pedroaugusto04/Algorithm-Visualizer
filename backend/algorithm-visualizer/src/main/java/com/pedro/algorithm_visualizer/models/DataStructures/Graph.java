package com.pedro.algorithm_visualizer.models.DataStructures;

import java.util.List;
import java.util.UUID;

import com.pedro.algorithm_visualizer.models.Edge;
import com.pedro.algorithm_visualizer.models.Node;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Graph extends DataStructure{
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private boolean directed = true;

    public Graph(){}

    public Graph(boolean directed){
        this.directed = directed;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    @OneToMany(mappedBy = "graph", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Node> nodes;

    @OneToMany(mappedBy = "graph", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Edge> edges;

    public List<Node> getNodes() {
        return nodes;
    }

    public void setNodes(List<Node> nodes) {
        this.nodes = nodes;
    }

    public List<Edge> getEdges() {
        return edges;
    }

    public void setEdges(List<Edge> edges) {
        this.edges = edges;
    }
}
