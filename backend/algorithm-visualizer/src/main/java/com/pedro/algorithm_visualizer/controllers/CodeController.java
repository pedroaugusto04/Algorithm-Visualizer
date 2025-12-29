package com.pedro.algorithm_visualizer.controllers;

import java.util.UUID;

import com.pedro.algorithm_visualizer.models.DTO.CodeRequestDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionResponseDTO;
import com.pedro.algorithm_visualizer.services.CodeService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/code")
@Tag(name = "Code Controller", description = "Endpoints para execução e verificação do código do usuário")
public class CodeController {

    private CodeService codeService;

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
                dto.testcase(),
                null
        );
        return ResponseEntity.ok(responseDTO);
    }

    @Operation(
            summary = "Executa o código inserido pelo usuário para análise das estruturas.",
            description = "Executa o código inserido pelo usuário para análise das estruturas. Testcase via arquivo"
    )
    @PostMapping(
            value = "/execute-file",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ExecutionResponseDTO> executeCodeFile(
            @RequestPart("payload") CodeRequestDTO dto,
            @RequestPart(value = "inputFile", required = false) MultipartFile inputFile
    ) {
        ExecutionResponseDTO responseDTO = codeService.execute(
                dto.language(),
                dto.code(),
                dto.testcase(),
                inputFile
        );
        return ResponseEntity.ok(responseDTO);
    }

}
