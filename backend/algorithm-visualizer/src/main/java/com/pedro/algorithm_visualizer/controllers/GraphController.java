package com.pedro.algorithm_visualizer.controllers;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.algorithm_visualizer.mappers.GraphMapper;
import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.DirectedUnweightedStrategy;
import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.DirectedWeightedStrategy;
import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.UndirectedUnweightedStrategy;
import com.pedro.algorithm_visualizer.mappers.GraphMapperStrategy.UndirectedWeightedStrategy;
import com.pedro.algorithm_visualizer.models.DTO.GraphDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.services.GraphService;

@RestController
@RequestMapping("/graph")
public class GraphController {

    private GraphService graphService;
    private GraphMapper graphMapper;

    GraphController(GraphService graphService, GraphMapper graphMapper){
        this.graphService = graphService;
        this.graphMapper = graphMapper;
    }
    
    @PostMapping("/createGraph/undirected/unweighted")
    public ResponseEntity<Void> createGraphUndirectedUnweighted(@RequestBody List<GraphDTO> graphDTO) {

        this.graphMapper.setStrategy(new UndirectedUnweightedStrategy());
        
        Graph graph = this.graphMapper.toGraph(graphDTO);

        this.graphService.saveGraph(graph);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/createGraph/undirected/weighted")
    public ResponseEntity<List<GraphDTO>>  createGraphUndirectedWeighted(@RequestBody List<GraphDTO> graphDTO) {
        
        this.graphMapper.setStrategy(new UndirectedWeightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO);

        this.graphService.saveGraph(graph);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/createGraph/directed/unweighted")
    public ResponseEntity<List<GraphDTO>>  createGraphDirectedUnweighted(@RequestBody List<GraphDTO> graphDTO) {

        this.graphMapper.setStrategy(new DirectedUnweightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO);

        this.graphService.saveGraph(graph);

        return ResponseEntity.ok().build();
    }
    @PostMapping("/createGraph/directed/weighted")
    public ResponseEntity<List<GraphDTO>>  createGraphDirectedWeighted(@RequestBody List<GraphDTO> graphDTO) {
        
        this.graphMapper.setStrategy(new DirectedWeightedStrategy());

        Graph graph = this.graphMapper.toGraph(graphDTO);

        this.graphService.saveGraph(graph);

        return ResponseEntity.ok().build();
    }
}
