package com.pedro.algorithm_visualizer.models.DataStructures;

import com.pedro.algorithm_visualizer.models.User;

import jakarta.persistence.Entity;

@Entity
public class UndirectedWeightedGraph extends Graph {

    public UndirectedWeightedGraph(){}

    public UndirectedWeightedGraph(User user){
        this.setUser(user);
    }

}
