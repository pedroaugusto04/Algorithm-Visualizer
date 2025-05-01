package com.pedro.algorithm_visualizer.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pedro.algorithm_visualizer.models.DataStructures.StructureType;
import com.pedro.algorithm_visualizer.models.enums.StructureTypeEnum;

@Repository
public interface StructureTypeRepository extends JpaRepository<StructureType, UUID> {
    
    Optional<StructureType> findByName(StructureTypeEnum name);
}
