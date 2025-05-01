package com.pedro.algorithm_visualizer.models.DataStructures;

import java.util.List;

import com.pedro.algorithm_visualizer.models.Edge;
import com.pedro.algorithm_visualizer.models.Node;
import com.pedro.algorithm_visualizer.models.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

@Entity
public abstract class Graph extends DataStructure {

    @OneToMany(mappedBy = "graph", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Node> nodes;

    @OneToMany(mappedBy = "graph", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Edge> edges;

    @ManyToOne
    private User user;

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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
