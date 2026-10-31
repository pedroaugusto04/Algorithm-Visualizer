package com.pedro.algorithm_visualizer.services;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class VisualizationTelemetryTest {
    @TempDir Path workspace;

    @Test
    void rejectsMissingEventLog() {
        var ex = assertThrows(IllegalStateException.class, () -> VisualizationTelemetry.readEvents(workspace));
        assertEquals("Arquivo de eventos de visualização não foi criado.", ex.getMessage());
    }

    @Test
    void returnsPartialTraceWhenRuntimeBudgetWasReached() throws Exception {
        String event = """
                {"schema":"av.event.v2","time":1,"type":"array","path":"v","op":"init","line":2,"value":[1,2,3]}
                """.strip();
        Files.writeString(workspace.resolve("events.jsonl"), event + "\n");
        Files.writeString(workspace.resolve("visualization.status"), "budget reached");

        var result = VisualizationTelemetry.readEvents(workspace);
        assertTrue(result.truncated());
        assertEquals("budget reached", result.warning());
        assertEquals(1, result.events().size());
    }

    @Test
    void acceptsEmptyLogWhenNothingWasTracked() throws Exception {
        Files.createFile(workspace.resolve("events.jsonl"));
        var result = VisualizationTelemetry.readEvents(workspace);
        assertEquals(List.of(), result.events());
        assertFalse(result.truncated());
        assertNull(result.warning());
    }

    @Test
    void readPartialEventsReturnEmptyOnMissingFile() {
        var result = VisualizationTelemetry.readPartialEvents(workspace);
        assertEquals(List.of(), result.events());
        assertFalse(result.truncated());
    }

    @Test
    void readPartialEventsDropsCutLastLineInsteadOfDiscardingEverything() throws Exception {
        String good = """
                {"schema":"av.event.v2","time":1,"type":"array","path":"v","op":"init","line":2,"value":[1]}
                {"schema":"av.event.v2","time":2,"type":"array","path":"v","op":"snapshot","line":3,"value":[2]}
                """.strip();
        Files.writeString(workspace.resolve("events.jsonl"), good + "\n{\"cut");

        var result = VisualizationTelemetry.readPartialEvents(workspace);
        assertEquals(2, result.events().size());
        assertTrue(result.truncated());
    }

    @Test
    void acceptsScalarEventsCorrectly() throws Exception {
        String event = """
                {"schema":"av.event.v2","time":1,"type":"scalar","path":"counter","op":"init","line":5,"value":42}
                """.strip();
        Files.writeString(workspace.resolve("events.jsonl"), event + "\n");

        var result = VisualizationTelemetry.readEvents(workspace);
        assertEquals(1, result.events().size());
        assertEquals(com.pedro.algorithm_visualizer.models.DTO.ExecutionEventType.SCALAR, result.events().get(0).type());
        assertEquals("counter", result.events().get(0).path());
        assertEquals(42, result.events().get(0).value().asInt());
    }

    @Test
    void rejectsEventWithOutOfOrderTime() throws Exception {
        String bad = """
                {"schema":"av.event.v2","time":5,"type":"array","path":"v","op":"init","line":2,"value":[]}
                {"schema":"av.event.v2","time":3,"type":"array","path":"v","op":"snapshot","line":3,"value":[1]}
                """.strip();
        Files.writeString(workspace.resolve("events.jsonl"), bad);
        assertThrows(Exception.class, () -> VisualizationTelemetry.readEvents(workspace));
    }
}
