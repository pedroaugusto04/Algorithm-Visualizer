package com.pedro.algorithm_visualizer.controllers;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pedro.algorithm_visualizer.models.DTO.CodeRequestDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionErrorCode;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionErrorDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionResponseDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionStage;
import com.pedro.algorithm_visualizer.services.CodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CodeControllerContractTest {
    private final CodeService codeService = mock(CodeService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new CodeController(codeService)).build();
    }

    @Test
    void executeRequestReturnsProgramOutputAndVisualizationEventsWithoutChangingTheirContent() throws Exception {
        String source = "#include <vector>\nint main(){ std::vector<int> v{1}; }";
        String testcase = "3 4\n";
        String output = "answer: 2\n";
        when(codeService.execute("cpp17", source, testcase))
                .thenReturn(new ExecutionResponseDTO(ExecutionResponseDTO.SCHEMA, true, ExecutionStage.COMPLETED,
                        output, "", 0, 10, java.util.List.of(), null));

        mvc.perform(post("/code/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CodeRequestDTO("cpp17", source, testcase))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.schema").value("av.execution.v1"))
                .andExpect(jsonPath("$.events").isArray())
                .andExpect(jsonPath("$.stdout").value(output))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.nullValue()));

        verify(codeService).execute(eq("cpp17"), eq(source), eq(testcase));
    }

    @Test
    void executionFailureRemainsAnExplicitFailureInTheApiContract() throws Exception {
        String source = "int main() {}";
        String error = "alias de contêiner observado não suportado";
        when(codeService.execute("cpp17", source, ""))
                .thenReturn(new ExecutionResponseDTO(ExecutionResponseDTO.SCHEMA, false,
                        ExecutionStage.INSTRUMENTATION, "", "", null, 5, java.util.List.of(),
                        new ExecutionErrorDTO(ExecutionErrorCode.INSTRUMENTATION_ERROR, error)));

        mvc.perform(post("/code/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CodeRequestDTO("cpp17", source, ""))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.events").isArray())
                .andExpect(jsonPath("$.error.code").value("instrumentation_error"))
                .andExpect(jsonPath("$.error.message").value(error));
    }
}
