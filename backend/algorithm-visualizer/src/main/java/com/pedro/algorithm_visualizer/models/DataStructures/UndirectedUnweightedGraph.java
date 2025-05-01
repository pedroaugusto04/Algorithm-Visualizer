package com.pedro.algorithm_visualizer.models.DataStructures;

import com.pedro.algorithm_visualizer.models.User;

import jakarta.persistence.Entity;

@Entity
public class UndirectedUnweightedGraph extends Graph {
    
    public UndirectedUnweightedGraph(){}

    public UndirectedUnweightedGraph(User user){
        this.setUser(user);
    }
}
