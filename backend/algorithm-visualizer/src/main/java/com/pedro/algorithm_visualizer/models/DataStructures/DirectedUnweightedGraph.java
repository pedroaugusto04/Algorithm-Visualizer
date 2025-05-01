package com.pedro.algorithm_visualizer.models.DataStructures;

import com.pedro.algorithm_visualizer.models.User;

import jakarta.persistence.Entity;

@Entity
public class DirectedUnweightedGraph extends Graph {

    public DirectedUnweightedGraph(){}

    public DirectedUnweightedGraph(User user){
        this.setUser(user);
    }
}
