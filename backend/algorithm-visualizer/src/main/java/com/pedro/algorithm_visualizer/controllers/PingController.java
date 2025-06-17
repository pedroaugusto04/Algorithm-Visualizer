package com.pedro.algorithm_visualizer.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Ping", description = "Endpoint para health check da API")
public class PingController {

    @Operation(summary = "Pinga a API", description = "Endpoint para verificar se a API está online e respondendo corretamente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "API está online")
    })
    @GetMapping("/")
    public String ping() {
        return "API online";
    }
}
