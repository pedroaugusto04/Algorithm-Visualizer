package com.pedro.algorithm_visualizer.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pedro.algorithm_visualizer.models.DataStructures.DataStructure;

@Repository
public interface DataStructureRepository extends JpaRepository<DataStructure, UUID> {
    
    Optional<DataStructure> findStructureTypeById(UUID id);
}
