package com.pedro.algorithm_visualizer.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.pedro.algorithm_visualizer.models.DataStructures.Graph;

@Repository
public interface GraphRepository extends JpaRepository<Graph, UUID> {

    @Query("SELECT g.id FROM Graph g WHERE g.user.id = :userId")
    List<UUID> findGraphIdsByUserId(UUID userId);
}