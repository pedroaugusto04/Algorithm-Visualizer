package com.pedro.algorithm_visualizer.models.DataStructures;

import com.pedro.algorithm_visualizer.models.User;

import jakarta.persistence.Entity;

@Entity
public class DirectedWeightedGraph extends Graph {

    public DirectedWeightedGraph(){}

    public DirectedWeightedGraph(User user){
        this.setUser(user);
    }
}
