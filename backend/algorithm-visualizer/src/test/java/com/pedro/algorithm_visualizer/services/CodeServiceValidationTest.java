package com.pedro.algorithm_visualizer.services;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.Test;

class CodeServiceValidationTest {
    @Test
    void rejectsUnknownCppStandardInsteadOfSilentlyUsingCpp17() {
        ContainerStepRunner runner = mock(ContainerStepRunner.class);
        CodeService service = new CodeService(runner);

        var response = service.execute("cpp99", "int main() {}", "");

        assertFalse(response.success());
        assertTrue(response.error().message().contains("Padrão C++ não suportado"));
        verifyNoInteractions(runner);
    }
}
