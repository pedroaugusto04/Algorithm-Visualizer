package com.pedro.algorithm_visualizer.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class VisualizationTelemetryTest {
    @TempDir Path workspace;

    @Test
    void rejectsMissingEventLog() {
        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> VisualizationTelemetry.readCompleteEvents(workspace));
        assertEquals("Arquivo de eventos de visualização não foi criado.", error.getMessage());
    }

    @Test
    void rejectsTruncatedTelemetryStatusEvenWhenPartialEventsExist() throws Exception {
        Files.writeString(workspace.resolve("events.jsonl"), "partial event\n");
        Files.writeString(workspace.resolve("visualization.status"), "event limit reached");

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> VisualizationTelemetry.readCompleteEvents(workspace));
        assertEquals("event limit reached", error.getMessage());
    }

    @Test
    void acceptsAnEmptyLogWhenNoTrackedVariablesWereEmitted() throws Exception {
        Files.createFile(workspace.resolve("events.jsonl"));
        assertEquals(java.util.List.of(), VisualizationTelemetry.readCompleteEvents(workspace));
    }
}
