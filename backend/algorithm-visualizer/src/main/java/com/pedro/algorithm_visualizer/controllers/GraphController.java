package com.pedro.algorithm_visualizer.controllers;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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

import jakarta.persistence.EntityNotFoundException;

@RestController
@RequestMapping("/graphs")
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

    @PostMapping("/createGraph/undirected/unweighted")
    public ResponseEntity<GraphIdDTO> createGraphUndirectedUnweighted(@RequestBody GraphDTO graphDTO) {
        
        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.UNDIRECTED_UNWEIGHTED_GRAPH)
    .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new UndirectedUnweightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser,type);

        UUID graphId = this.graphService.saveGraph(graph);

        GraphIdDTO graphIdDTO= new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @PostMapping("/createGraph/undirected/weighted")
    public ResponseEntity<GraphIdDTO> createGraphUndirectedWeighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.UNDIRECTED_WEIGHTED_GRAPH)
    .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new UndirectedWeightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser,type);

        UUID graphId = this.graphService.saveGraph(graph);

        GraphIdDTO graphIdDTO= new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @PostMapping("/createGraph/directed/unweighted")
    public ResponseEntity<GraphIdDTO> createGraphDirectedUnweighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.DIRECTED_UNWEIGHTED_GRAPH)
    .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new DirectedUnweightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser,type);

        UUID graphId = this.graphService.saveGraph(graph);

        GraphIdDTO graphIdDTO= new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @PostMapping("/createGraph/directed/weighted")
    public ResponseEntity<GraphIdDTO> createGraphDirectedWeighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        StructureType type = structureTypeRepository.findByName(StructureTypeEnum.DIRECTED_WEIGHTED_GRAPH)
    .orElseThrow(() -> new EntityNotFoundException("StructureType not found"));

        this.graphMapper.setStrategy(new DirectedWeightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser,type);

        UUID graphId = this.graphService.saveGraph(graph);

        GraphIdDTO graphIdDTO= new GraphIdDTO(graphId);

        return ResponseEntity.ok(graphIdDTO);
    }

    @GetMapping("/")
    public ResponseEntity<GraphDTO> getGraphById(@RequestParam String graphId) {

        GraphDTO graph = graphService.getGraphDTOById(UUID.fromString(graphId));

        return ResponseEntity.ok(graph);
    }
}
