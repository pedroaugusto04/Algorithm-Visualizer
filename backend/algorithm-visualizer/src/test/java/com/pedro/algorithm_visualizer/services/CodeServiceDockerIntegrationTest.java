package com.pedro.algorithm_visualizer.services;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class CodeServiceDockerIntegrationTest {
    private final CodeService service = new CodeService(new ContainerStepRunner());

    @Test
    void executesProgramWithStdinAndReturnsVisualization() {
        var response = service.execute("cpp17",
                "#include <iostream>\n#include <vector>\nint main(){ int n; std::cin >> n; std::vector<int> v{n}; std::cout << v[0] * 2 << '\\n'; }",
                "21\n");

        assertTrue(response.success(), response.error());
        assertTrue(response.stdout().contains("42"));
        assertTrue(response.events().stream().anyMatch(event -> event.op().value().equals("init")));
    }

    @Test
    void reportsInstrumentationFailureAsAnExplicitFailure() {
        var response = service.execute("cpp17", "int main( {", "");

        assertFalse(response.success());
        assertTrue(response.error().code().value().equals("instrumentation_error"));
    }

    @Test
    void reportsExecutionTimeoutSeparately() {
        CodeService shortTimeoutService = new CodeService(new ContainerStepRunner(2));
        var response = shortTimeoutService.execute("cpp17", "int main(){ while(true) {} }", "");

        assertFalse(response.success());
        assertTrue(response.error().code().value().equals("timeout"));
    }
}
