package com.pedro.algorithm_visualizer.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.algorithm_visualizer.models.Algorithm;
import com.pedro.algorithm_visualizer.services.DataStructureService;
import com.pedro.algorithm_visualizer.services.StructureTypeService;

@RestController
@RequestMapping("/algorithms")
public class AlgorithmController {
    
    private DataStructureService dataStructureService;
    private StructureTypeService structureTypeService;

    AlgorithmController(DataStructureService dataStructureService, StructureTypeService structureTypeService){
        this.dataStructureService = dataStructureService;
        this.structureTypeService = structureTypeService;
    }

    @GetMapping("/getStructureSupportedAlgorithms/")
    public ResponseEntity<List<Algorithm>> getDataStructureSupportedAlgorithms(@RequestParam String dataStructureId) {

        UUID structureTypeId = this.dataStructureService.getStructureTypeById(UUID.fromString(dataStructureId)).getId();

        List<Algorithm> supportedAlgorithms = 
        this.structureTypeService.getAlgorithmsSupportedByStructureType(structureTypeId);

        return ResponseEntity.ok(supportedAlgorithms);
    }
}
