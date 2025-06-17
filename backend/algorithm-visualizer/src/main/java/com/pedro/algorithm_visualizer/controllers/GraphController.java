package com.pedro.algorithm_visualizer.controllers;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.algorithm_visualizer.mappers.GraphMapper;
import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.DirectedUnweightedStrategy;
import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.DirectedWeightedStrategy;
import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.UndirectedUnweightedStrategy;
import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.UndirectedWeightedStrategy;
import com.pedro.algorithm_visualizer.models.DTO.GraphDTO;
import com.pedro.algorithm_visualizer.models.DTO.GraphIdDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.models.DataStructures.StructureType;
import com.pedro.algorithm_visualizer.models.User;
import com.pedro.algorithm_visualizer.models.enums.StructureTypeEnum;
import com.pedro.algorithm_visualizer.repositories.StructureTypeRepository;
import com.pedro.algorithm_visualizer.services.GraphService;
import com.pedro.algorithm_visualizer.services.UserDetailsServiceImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;

@RestController
@RequestMapping("/graphs")
@Tag(name = "Graph Controller", description = "Endpoints para criação, atualização e consulta de grafos")
public class GraphController {

    private GraphService graphService;
    private GraphMapper graphMapper;
    private UserDetailsServiceImpl userDetailsService;
    private StructureTypeRepository structureTypeRepository;

    GraphController(GraphService graphService, GraphMapper graphMapper, UserDetailsServiceImpl userDetailsService,
            StructureTypeRepository structureTypeRepository) {
        this.graphService = graphService;
        this.graphMapper = graphMapper;
        this.userDetailsService = userDetailsService;
        this.structureTypeRepository = structureTypeRepository;
    }

    @Operation(
        summary = "Criar grafo não dirigido e não ponderado",
        description = "Cria um grafo do tipo não dirigido e sem pesos, associando-o ao usuário logado.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Dados do grafo a ser criado",
            content = @Content(schema = @Schema(implementation = GraphDTO.class))
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Grafo criado com sucesso",
                content = @Content(schema = @Schema(implementation = GraphIdDTO.class))),
            @ApiResponse(responseCode = "404", description = "Tipo de estrutura ou estratégia de execução não encontrada", content = @Content)
        }
    )
    @PostMapping("/undirected/unweighted")
    public ResponseEntity<GraphIdDTO> createGraphUndirectedUnweighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.UNDIRECTED_UNWEIGHTED_GRAPH)
                .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new UndirectedUnweightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser, type);

        UUID graphId = this.graphService.saveGraph(graph);

        GraphIdDTO graphIdDTO = new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }


    @Operation(
        summary = "Criar grafo não dirigido e ponderado",
        description = "Cria um grafo do tipo não dirigido e ponderado, associando-o ao usuário logado.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Dados do grafo a ser criado",
            content = @Content(schema = @Schema(implementation = GraphDTO.class))
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Grafo criado com sucesso",
                content = @Content(schema = @Schema(implementation = GraphIdDTO.class))),
            @ApiResponse(responseCode = "404", description = "Tipo de estrutura ou estratégia de execução não encontrada", content = @Content)
        }
    )
    @PostMapping("/undirected/weighted")
    public ResponseEntity<GraphIdDTO> createGraphUndirectedWeighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.UNDIRECTED_WEIGHTED_GRAPH)
                .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new UndirectedWeightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser, type);

        UUID graphId = this.graphService.saveGraph(graph);

        GraphIdDTO graphIdDTO = new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @Operation(
        summary = "Criar grafo dirigido e não ponderado",
        description = "Cria um grafo do tipo dirigido e sem pesos, associando-o ao usuário logado.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Dados do grafo a ser criado",
            content = @Content(schema = @Schema(implementation = GraphDTO.class))
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Grafo criado com sucesso",
                content = @Content(schema = @Schema(implementation = GraphIdDTO.class))),
            @ApiResponse(responseCode = "404", description = "Tipo de estrutura ou estratégia de execução não encontrada", content = @Content)
        }
    )
    @PostMapping("/directed/unweighted")
    public ResponseEntity<GraphIdDTO> createGraphDirectedUnweighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.DIRECTED_UNWEIGHTED_GRAPH)
                .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new DirectedUnweightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser, type);

        UUID graphId = this.graphService.saveGraph(graph);

        GraphIdDTO graphIdDTO = new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @Operation(
        summary = "Criar grafo dirigido e ponderado",
        description = "Cria um grafo do tipo dirigido e ponderado, associando-o ao usuário logado.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Dados do grafo a ser criado",
            content = @Content(schema = @Schema(implementation = GraphDTO.class))
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Grafo criado com sucesso",
                content = @Content(schema = @Schema(implementation = GraphIdDTO.class))),
            @ApiResponse(responseCode = "404", description = "Tipo de estrutura ou estratégia de execução não encontrada", content = @Content)
        }
    )
    @PostMapping("/directed/weighted")
    public ResponseEntity<GraphIdDTO> createGraphDirectedWeighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.DIRECTED_WEIGHTED_GRAPH)
                .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new DirectedWeightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser, type);

        UUID graphId = this.graphService.saveGraph(graph);

        GraphIdDTO graphIdDTO = new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @Operation(
        summary = "Atualizar grafo não dirigido e não ponderado",
        description = "Atualiza um grafo do tipo não dirigido e não ponderado pelo UUID fornecido.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Dados do grafo para atualização (deve conter o UUID)",
            content = @Content(schema = @Schema(implementation = GraphDTO.class))
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Grafo atualizado com sucesso",
                content = @Content(schema = @Schema(implementation = GraphIdDTO.class))),
            @ApiResponse(responseCode = "404", description = "Tipo de estrutura ou estratégia de execução não encontrada", content = @Content)
        }
    )
    @PutMapping("/undirected/unweighted")
    public ResponseEntity<GraphIdDTO> updateGraphUndirectedUnweighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.UNDIRECTED_UNWEIGHTED_GRAPH)
                .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new UndirectedUnweightedStrategy());

        Graph currentGraph = this.graphService.getGraphById(graphDTO.id());

        this.graphService.clearEdgesAndNodesGraph(currentGraph);

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser, type); // apenas para transferir os nos e arestas

        graph.getNodes().forEach(node -> {
            node.setGraph(currentGraph);
            currentGraph.getNodes().add(node);
        });

        graph.getEdges().forEach(edge -> {
            edge.setGraph(currentGraph);
            currentGraph.getEdges().add(edge);
        });


        UUID graphId = this.graphService.saveGraph(currentGraph);

        GraphIdDTO graphIdDTO = new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @Operation(
        summary = "Atualizar grafo não dirigido e ponderado",
        description = "Atualiza um grafo do tipo não dirigido e ponderado pelo UUID fornecido.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Dados do grafo para atualização (deve conter o UUID)",
            content = @Content(schema = @Schema(implementation = GraphDTO.class))
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Grafo atualizado com sucesso",
                content = @Content(schema = @Schema(implementation = GraphIdDTO.class))),
            @ApiResponse(responseCode = "404", description = "Tipo de estrutura ou estratégia de execução não encontrada", content = @Content)
        }
    )
    @PutMapping("/undirected/weighted")
    public ResponseEntity<GraphIdDTO> updateGraphUndirectedWeighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.UNDIRECTED_WEIGHTED_GRAPH)
                .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new UndirectedWeightedStrategy());

        Graph currentGraph = this.graphService.getGraphById(graphDTO.id());

        this.graphService.clearEdgesAndNodesGraph(currentGraph);

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser, type); // apenas para transferir os nos e arestas

        graph.getNodes().forEach(node -> {
            node.setGraph(currentGraph);
            currentGraph.getNodes().add(node);
        });

        graph.getEdges().forEach(edge -> {
            edge.setGraph(currentGraph);
            currentGraph.getEdges().add(edge);
        });

        UUID graphId = this.graphService.saveGraph(currentGraph);

        GraphIdDTO graphIdDTO = new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @Operation(
        summary = "Atualizar grafo dirigido e não ponderado",
        description = "Atualiza um grafo do tipo dirigido e não ponderado pelo UUID fornecido.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Dados do grafo para atualização (deve conter o UUID)",
            content = @Content(schema = @Schema(implementation = GraphDTO.class))
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Grafo atualizado com sucesso",
                content = @Content(schema = @Schema(implementation = GraphIdDTO.class))),
            @ApiResponse(responseCode = "404", description = "Tipo de estrutura ou estratégia de execução não encontrada", content = @Content)
        }
    )
    @PutMapping("/directed/unweighted")
    public ResponseEntity<GraphIdDTO> updateGraphDirectedUnweighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.DIRECTED_UNWEIGHTED_GRAPH)
                .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new DirectedUnweightedStrategy());

        Graph currentGraph = this.graphService.getGraphById(graphDTO.id());

        this.graphService.clearEdgesAndNodesGraph(currentGraph);

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser, type); // apenas para transferir os nos e arestas

        graph.getNodes().forEach(node -> {
            node.setGraph(currentGraph);
            currentGraph.getNodes().add(node);
        });

        graph.getEdges().forEach(edge -> {
            edge.setGraph(currentGraph);
            currentGraph.getEdges().add(edge);
        });


        UUID graphId = this.graphService.saveGraph(currentGraph);

        GraphIdDTO graphIdDTO = new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @Operation(
        summary = "Atualizar grafo dirigido e ponderado",
        description = "Atualiza um grafo do tipo dirigido e ponderado pelo UUID fornecido.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Dados do grafo para atualização (deve conter o UUID)",
            content = @Content(schema = @Schema(implementation = GraphDTO.class))
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Grafo atualizado com sucesso",
                content = @Content(schema = @Schema(implementation = GraphIdDTO.class))),
            @ApiResponse(responseCode = "404", description = "Tipo de estrutura ou estratégia de execução não encontrada", content = @Content)
        }
    )
    @PutMapping("/directed/weighted")
    public ResponseEntity<GraphIdDTO> updateGraphDirectedWeighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.DIRECTED_WEIGHTED_GRAPH)
                .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new DirectedWeightedStrategy());

        Graph currentGraph = this.graphService.getGraphById(graphDTO.id());

        this.graphService.clearEdgesAndNodesGraph(currentGraph);

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser, type); // apenas para transferir os nos e arestas

        graph.getNodes().forEach(node -> {
            node.setGraph(currentGraph);
            currentGraph.getNodes().add(node);
        });

        graph.getEdges().forEach(edge -> {
            edge.setGraph(currentGraph);
            currentGraph.getEdges().add(edge);
        });

        UUID graphId = this.graphService.saveGraph(currentGraph);

        GraphIdDTO graphIdDTO = new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @Operation(
        summary = "Obter grafo pelo UUID",
        description = "Retorna os dados do grafo especificado pelo UUID.",
        parameters = {
            @Parameter(name = "graphId", description = "UUID do grafo a ser buscado", required = true, example = "550e8400-e29b-41d4-a716-446655440000")
        },
        responses = {
            @ApiResponse(responseCode = "200", description = "Grafo encontrado e retornado",
                content = @Content(schema = @Schema(implementation = GraphDTO.class))),
            @ApiResponse(responseCode = "404", description = "Grafo não encontrado", content = @Content)
        }
    )
    @GetMapping("/")
    public ResponseEntity<GraphDTO> getGraphById(@RequestParam String graphId) {

        GraphDTO graph = graphService.getGraphDTOById(UUID.fromString(graphId));

        return ResponseEntity.ok(graph);
    }
}
