package com.pedro.algorithm_visualizer.repositories;


import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pedro.algorithm_visualizer.models.Algorithm;
import com.pedro.algorithm_visualizer.models.enums.AlgorithmEnum;


@Repository
public interface AlgorithmRepository extends JpaRepository<Algorithm, UUID> {
    boolean existsByName(String name);

    Optional<Algorithm> findByName(AlgorithmEnum name);

    List<Algorithm> findBySupportedStructureTypesId(UUID structureTypeId);
}
