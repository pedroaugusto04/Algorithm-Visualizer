package com.pedro.algorithm_visualizer.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.algorithm_visualizer.services.GeminiService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

@RestController
@RequestMapping("/gemini")
public class GeminiController {

    private final GeminiService geminiService; 

    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @Operation(
        summary = "Obter explicação do prompt pelo Gemini AI",
        description = "Recebe um prompt e retorna uma explicação gerada pelo serviço Gemini AI.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Payload contendo o prompt para geração da explicação"
        ),
        responses = {
            @ApiResponse(responseCode = "200", description = "Explicação gerada com sucesso",
                content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "400", description = "Prompt vazio", content = @Content)
        }
    )
    @PostMapping("/explain")
    public ResponseEntity<String> explainStep(@RequestBody Map<String, String> payload) {
        String prompt = payload.get("prompt");

        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Prompt cannot be empty.");
        }

        String explanation = geminiService.getAIExplanation(prompt);

        return ResponseEntity.ok(explanation);
    }
}