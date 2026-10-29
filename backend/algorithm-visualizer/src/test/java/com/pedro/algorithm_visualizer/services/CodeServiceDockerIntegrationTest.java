package com.pedro.algorithm_visualizer.services;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class CodeServiceDockerIntegrationTest {
    private final CodeService service = new CodeService(new ContainerStepRunner());

    @Test
    void executesProgramWithStdinAndReturnsVisualization() {
        var r = service.execute("cpp17",
                "#include <iostream>\n#include <vector>\nint main(){ int n; std::cin >> n; std::vector<int> v{n}; std::cout << v[0] * 2 << '\\n'; }",
                "21\n");

        assertTrue(r.success(), () -> r.error().message());
        assertTrue(r.stdout().contains("42"));
        assertTrue(r.events().stream().anyMatch(e -> e.op().value().equals("init")));
    }

    @Test
    void reportsInstrumentationFailureExplicitly() {
        var r = service.execute("cpp17", "int main( {", "");

        assertFalse(r.success());
        assertEquals("instrumentation_error", r.error().code().value());
        assertTrue(r.events().isEmpty(), "no partial trace on instrumentation failure");
    }

    @Test
    void reportsExecutionTimeoutWithPartialTrace() {
        CodeService short$ = new CodeService(new ContainerStepRunner(2));
        var r = short$.execute("cpp17",
                "#include <vector>\nint main(){ std::vector<int> v(3,0); while(true) v[0]++; }",
                "");

        assertFalse(r.success());
        assertEquals("timeout", r.error().code().value());
        // partial trace: the init event must have been recorded before the infinite loop
        assertFalse(r.events().isEmpty(), "expect at least the init event for v");
        assertTrue(r.truncated());
        assertFalse(r.warnings().isEmpty());
    }

    @Test
    void crashReturnsPartialTrace() {
        var r = service.execute("cpp17",
                "#include <vector>\nint main(){ std::vector<int> v{1,2,3}; v[0]++; v.at(99); }",
                "");

        assertFalse(r.success());
        // at least the init event for v is expected before the crash
        assertFalse(r.events().isEmpty(), "expect partial trace up to the crash");
        assertTrue(r.truncated());
    }
}
