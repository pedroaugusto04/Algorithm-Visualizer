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
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.models.User;
import com.pedro.algorithm_visualizer.services.GraphService;
import com.pedro.algorithm_visualizer.services.UserDetailsServiceImpl;

@RestController
@RequestMapping("/graphs")
public class GraphController {

    private GraphService graphService;
    private GraphMapper graphMapper;
    private UserDetailsServiceImpl userDetailsService;

    GraphController(GraphService graphService, GraphMapper graphMapper, UserDetailsServiceImpl userDetailsService) {
        this.graphService = graphService;
        this.graphMapper = graphMapper;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping("/createGraph/undirected/unweighted")
    public ResponseEntity<Void> createGraphUndirectedUnweighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        this.graphMapper.setStrategy(new UndirectedUnweightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser);
        this.graphService.saveGraph(graph);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/createGraph/undirected/weighted")
    public ResponseEntity<Void> createGraphUndirectedWeighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        this.graphMapper.setStrategy(new UndirectedWeightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser);

        this.graphService.saveGraph(graph);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/createGraph/directed/unweighted")
    public ResponseEntity<Void> createGraphDirectedUnweighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        this.graphMapper.setStrategy(new DirectedUnweightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser);

        this.graphService.saveGraph(graph);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/createGraph/directed/weighted")
    public ResponseEntity<Void> createGraphDirectedWeighted(@RequestBody GraphDTO graphDTO) {

        User loggedUser = this.userDetailsService.getLoggedUser();

        this.graphMapper.setStrategy(new DirectedWeightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO, loggedUser);

        this.graphService.saveGraph(graph);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/")
    public ResponseEntity<GraphDTO> getGraphById(@RequestParam String graphId) {

        GraphDTO graph = graphService.getGraphById(UUID.fromString(graphId));

        return ResponseEntity.ok(graph);
    }
}
