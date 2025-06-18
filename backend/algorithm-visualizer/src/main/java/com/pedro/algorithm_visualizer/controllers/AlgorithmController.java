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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/algorithms")
@Tag(name = "Algorithm Controller", description = "Endpoints para verificar informações acerca dos algoritmos e executá-los")
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

    @Operation(
        summary = "Listar algoritmos suportados por uma estrutura de dados",
        description = "Retorna todos os algoritmos disponíveis para uma determinada estrutura de dados.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Lista de algoritmos retornada com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = Algorithm.class))),
            @ApiResponse(responseCode = "404", description = "Estrutura de dados não encontrada", content = @Content)
        }
    )
    @GetMapping("/")
    public ResponseEntity<List<Algorithm>> getDataStructureSupportedAlgorithms(@Parameter(description = "UUID da estrutura de dados", required = true) 
    @RequestParam String dataStructureId) {

        UUID structureTypeId = this.dataStructureService.getStructureTypeById(UUID.fromString(dataStructureId)).getId();

        List<Algorithm> supportedAlgorithms = 
        this.structureTypeService.getAlgorithmsSupportedByStructureType(structureTypeId);

        return ResponseEntity.ok(supportedAlgorithms);
    }

    @Operation(
        summary = "Executar algoritmo de grafo",
        description = "Executa o algoritmo especificado sobre o grafo informado.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Objeto contendo UUID do grafo e UUID do algoritmo a ser executado",
            content = @Content(schema = @Schema(implementation = GraphAlgorithmDTO.class))
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Algoritmo executado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = ExecutedNodesDTO.class))),
            @ApiResponse(responseCode = "400", description = "Algoritmo não suportado", content = @Content),
            @ApiResponse(responseCode = "404", description = "Grafo não encontrado", content = @Content),
            @ApiResponse(responseCode = "403", description = "Acesso proibido", content = @Content)
        }
    )
    @PostMapping("/execute/graph")
    public ResponseEntity<ExecutedNodesDTO> executeGraphAlgorithm(@RequestBody GraphAlgorithmDTO algorithm) {
        
        GraphAlgorithmStrategy algorithmEstrategy = 
        this.graphAlgorithmStrategyFactory.getAlgorithmStrategyInstance(algorithm.algorithmId());

        Graph graph = this.graphService.getGraphById(algorithm.graphId());

        GraphAdjList executionGraph = GraphToAdjListMapper.convertToAdjacencyList(graph);

        ExecutedNodesDTO executedNodes = algorithmEstrategy.run(executionGraph);

        return ResponseEntity.ok(executedNodes);
    }
}
