package com.pedro.algorithm_visualizer.controllers;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.models.DTO.GraphDTO;

@RestController
public class GraphController {
    
    @PostMapping("/createGraph/undirected/unweighted")
    public ResponseEntity<List<GraphDTO>> createGraphUndirectedUnweighted(@RequestBody List<GraphDTO> graphInfo) {
        return ResponseEntity.ok(graphInfo);
    }

    @PostMapping("/createGraph/undirected/weighted")
    public ResponseEntity<List<GraphDTO>>  createGraphUndirectedWeighted(@RequestBody List<GraphDTO> graphInfo) {
        return ResponseEntity.ok(graphInfo);
    }

    @PostMapping("/createGraph/directed/unweighted")
    public ResponseEntity<List<GraphDTO>>  createGraphDirectedUnweighted(@RequestBody List<GraphDTO> graphInfo) {
        return ResponseEntity.ok(graphInfo);
    }
    @PostMapping("/createGraph/directed/weighted")
    public ResponseEntity<List<GraphDTO>>  createGraphDirectedWeighted(@RequestBody List<GraphDTO> graphInfo) {
        return ResponseEntity.ok(graphInfo);
    }
}
