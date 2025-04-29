package com.pedro.algorithm_visualizer.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pedro.algorithm_visualizer.models.DataStructures.Graph;

@Repository
public interface GraphRepository extends JpaRepository<Graph, UUID> {

}