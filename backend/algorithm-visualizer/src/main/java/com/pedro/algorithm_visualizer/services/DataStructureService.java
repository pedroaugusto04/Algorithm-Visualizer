package com.pedro.algorithm_visualizer.services;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.pedro.algorithm_visualizer.models.DataStructures.StructureType;
import com.pedro.algorithm_visualizer.repositories.DataStructureRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class DataStructureService {

    private DataStructureRepository dataStructureRepository;

    DataStructureService(DataStructureRepository dataStructureRepository){
        this.dataStructureRepository = dataStructureRepository;
    }

    public StructureType getStructureTypeById(UUID dataStructureId) {

        StructureType structureType = 
        this.dataStructureRepository.findStructureTypeById(dataStructureId)
        .orElseThrow(() -> new EntityNotFoundException()).getStructureType();

        return structureType;
    }
}
