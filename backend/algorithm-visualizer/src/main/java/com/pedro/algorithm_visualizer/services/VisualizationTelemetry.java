package com.pedro.algorithm_visualizer.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionEventDTO;

final class VisualizationTelemetry {
    private static final String EVENT_FILE = "events.jsonl";
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Set<String> EVENT_FIELDS = Set.of("schema", "time", "type", "path", "op", "line", "value");

    private VisualizationTelemetry() {}

    static List<ExecutionEventDTO> readCompleteEvents(Path workspace) throws IOException {
        Path status = workspace.resolve("visualization.status");
        if (Files.exists(status)) {
            throw new IllegalStateException(Files.readString(status, StandardCharsets.UTF_8));
        }
        Path events = workspace.resolve(EVENT_FILE);
        if (!Files.exists(events)) {
            throw new IllegalStateException("Arquivo de eventos de visualização não foi criado.");
        }

        List<ExecutionEventDTO> result = new ArrayList<>();
        long previousTime = 0;
        for (String line : Files.readAllLines(events, StandardCharsets.UTF_8)) {
            if (line.isBlank()) continue;
            JsonNode parsed = JSON.readTree(line);
            if (!(parsed instanceof ObjectNode event)) throw invalidEvent();

            Set<String> actualFields = new HashSet<>();
            event.fieldNames().forEachRemaining(actualFields::add);
            if (!actualFields.equals(EVENT_FIELDS)
                    || !event.path("schema").isTextual()
                    || !event.path("time").isIntegralNumber()
                    || !event.path("type").isTextual()
                    || !event.path("path").isTextual()
                    || !event.path("op").isTextual()
                    || !event.path("line").isIntegralNumber()) {
                throw invalidEvent();
            }
            if (!ExecutionEventDTO.SCHEMA.equals(event.path("schema").asText())) {
                throw new IllegalStateException("Versão de evento de visualização não suportada: "
                        + event.path("schema").asText());
            }

            ExecutionEventDTO typed = JSON.treeToValue(event, ExecutionEventDTO.class);
            if (typed.time() <= previousTime || typed.line() < 1
                    || typed.path().isBlank() || typed.value() == null) {
                throw invalidEvent();
            }
            previousTime = typed.time();
            result.add(typed);
        }
        return List.copyOf(result);
    }

    private static IllegalStateException invalidEvent() {
        return new IllegalStateException("Evento de visualização viola o contrato av.event.v1.");
    }
}
