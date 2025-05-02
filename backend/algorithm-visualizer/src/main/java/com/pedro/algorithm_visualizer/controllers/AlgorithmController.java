package com.pedro.algorithm_visualizer.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.algorithm_visualizer.graphAlgorithmStrategy.GraphAlgorithmStrategy;
import com.pedro.algorithm_visualizer.graphAlgorithmStrategy.GraphAlgorithmStrategyFactory;
import com.pedro.algorithm_visualizer.mappers.GraphToAdjListMapper;
import com.pedro.algorithm_visualizer.models.Algorithm;
import com.pedro.algorithm_visualizer.models.DTO.GraphAlgorithmDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.DTO.ExecutedNodesDTO;
import com.pedro.algorithm_visualizer.models.ExecutionDataStructures.GraphAdjList;
import com.pedro.algorithm_visualizer.services.DataStructureService;
import com.pedro.algorithm_visualizer.services.GraphService;
import com.pedro.algorithm_visualizer.services.StructureTypeService;

@RestController
@RequestMapping("/algorithms")
public class AlgorithmController {

    private DataStructureService dataStructureService;
    private StructureTypeService structureTypeService;
    private GraphAlgorithmStrategyFactory graphAlgorithmStrategyFactory;
    private GraphService graphService;

    AlgorithmController(DataStructureService dataStructureService, StructureTypeService structureTypeService,
    GraphAlgorithmStrategyFactory graphAlgorithmStrategyFactory, GraphService graphService){
        this.dataStructureService = dataStructureService;
        this.structureTypeService = structureTypeService;
        this.graphAlgorithmStrategyFactory = graphAlgorithmStrategyFactory;
        this.graphService = graphService;
    }

    @GetMapping("/getStructureSupportedAlgorithms/")
    public ResponseEntity<List<Algorithm>> getDataStructureSupportedAlgorithms(@RequestParam String dataStructureId) {

        UUID structureTypeId = this.dataStructureService.getStructureTypeById(UUID.fromString(dataStructureId)).getId();

        List<Algorithm> supportedAlgorithms = 
        this.structureTypeService.getAlgorithmsSupportedByStructureType(structureTypeId);

        return ResponseEntity.ok(supportedAlgorithms);
    }

    @PostMapping("/executeGraphAlgorithm")
    public ResponseEntity<ExecutedNodesDTO> executeGraphAlgorithm(@RequestBody GraphAlgorithmDTO algorithm) {
        
        GraphAlgorithmStrategy algorithmEstrategy = 
        this.graphAlgorithmStrategyFactory.getAlgorithmStrategyInstance(algorithm.algorithmId());

        Graph graph = this.graphService.getGraphById(algorithm.graphId());

        GraphAdjList executionGraph = GraphToAdjListMapper.convertToAdjacencyList(graph);

        ExecutedNodesDTO executedNodes = algorithmEstrategy.run(executionGraph);

        return ResponseEntity.ok(executedNodes);
    }
}
