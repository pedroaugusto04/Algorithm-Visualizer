package com.pedro.algorithm_visualizer.services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.pedro.algorithm_visualizer.models.Algorithm;
import com.pedro.algorithm_visualizer.repositories.AlgorithmRepository;

@Service
public class StructureTypeService {

    private AlgorithmRepository algorithmRepository;

    StructureTypeService(AlgorithmRepository algorithmRepository) {
        this.algorithmRepository = algorithmRepository;
    }

    public List<Algorithm> getAlgorithmsSupportedByStructureType(UUID structureTypeId){
        
        return this.algorithmRepository.findBySupportedStructureTypesId(structureTypeId);
    }
}
