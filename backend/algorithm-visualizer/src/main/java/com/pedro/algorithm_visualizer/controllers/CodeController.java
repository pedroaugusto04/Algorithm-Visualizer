package com.pedro.algorithm_visualizer.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.algorithm_visualizer.models.DTO.CodeRequestDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionResponseDTO;
import com.pedro.algorithm_visualizer.services.CodeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/code")
@Tag(name = "Code Controller", description = "Endpoints para execução e verificação do código do usuário")
public class CodeController {

    private final CodeService codeService;

    CodeController(CodeService codeService) {
        this.codeService = codeService;
    }

    @Operation(
            summary = "Executa o código inserido pelo usuário para análise das estruturas.",
            description = "Executa o código inserido pelo usuário para análise das estruturas. Testcase via formulario"
    )
    @PostMapping("/execute")
    public ResponseEntity<ExecutionResponseDTO> executeCode(
            @RequestBody CodeRequestDTO dto
    ) {
        ExecutionResponseDTO responseDTO = codeService.execute(
                dto.language(),
                dto.code(),
                dto.testcase()
        );
        return ResponseEntity.ok(responseDTO);
    }
}
