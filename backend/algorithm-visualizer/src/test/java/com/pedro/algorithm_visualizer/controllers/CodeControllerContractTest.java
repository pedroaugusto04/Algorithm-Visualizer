package com.pedro.algorithm_visualizer.controllers;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pedro.algorithm_visualizer.models.DTO.*;
import com.pedro.algorithm_visualizer.services.CodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

class CodeControllerContractTest {
    private final CodeService codeService = mock(CodeService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new CodeController(codeService)).build();
    }

    @Test
    void successResponseContainsSchemaEventsAndNoError() throws Exception {
        String source   = "#include <vector>\nint main(){ std::vector<int> v{1}; }";
        String testcase = "3 4\n";
        String output   = "answer: 2\n";

        when(codeService.execute("cpp17", source, testcase))
                .thenReturn(new ExecutionResponseDTO(
                        ExecutionResponseDTO.SCHEMA, true, ExecutionStage.COMPLETED,
                        output, "", 0, 10, List.of(), null, false, List.of()));

        mvc.perform(post("/code/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CodeRequestDTO("cpp17", source, testcase))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.schema").value("av.execution.v1"))
                .andExpect(jsonPath("$.events").isArray())
                .andExpect(jsonPath("$.stdout").value(output))
                .andExpect(jsonPath("$.truncated").value(false))
                .andExpect(jsonPath("$.warnings").isArray())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.nullValue()));

        verify(codeService).execute(eq("cpp17"), eq(source), eq(testcase));
    }

    @Test
    void failureResponseIncludesErrorAndMayCarryPartialTrace() throws Exception {
        String source = "int main() {}";
        String error  = "alias de contêiner observado não suportado";

        when(codeService.execute("cpp17", source, ""))
                .thenReturn(new ExecutionResponseDTO(
                        ExecutionResponseDTO.SCHEMA, false,
                        ExecutionStage.INSTRUMENTATION, "", "", null, 5, List.of(),
                        new ExecutionErrorDTO(ExecutionErrorCode.INSTRUMENTATION_ERROR, error),
                        false, List.of()));

        mvc.perform(post("/code/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CodeRequestDTO("cpp17", source, ""))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.events").isArray())
                .andExpect(jsonPath("$.truncated").value(false))
                .andExpect(jsonPath("$.error.code").value("instrumentation_error"))
                .andExpect(jsonPath("$.error.message").value(error));
    }
}
