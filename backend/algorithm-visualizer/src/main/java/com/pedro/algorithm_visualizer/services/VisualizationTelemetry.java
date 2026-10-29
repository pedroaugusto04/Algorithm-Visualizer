package com.pedro.algorithm_visualizer.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionEventDTO;

final class VisualizationTelemetry {
    private static final String EVENT_FILE = "events.jsonl";
    private static final String STATUS_FILE = "visualization.status";
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Set<String> EVENT_FIELDS = Set.of("schema", "time", "type", "path", "op", "line", "value");

    /**
     * @param truncated true when the runtime stopped tracing early, so {@code events} is a prefix of the run.
     * @param warning   runtime-provided reason for the truncation, or null.
     */
    record Result(List<ExecutionEventDTO> events, boolean truncated, String warning) {}

    private VisualizationTelemetry() {}

    /**
     * Reads the trace of a run that finished normally. A runtime budget stop is not an error: the
     * recorded prefix is returned as a truncated trace with the runtime's reason.
     */
    static Result readEvents(Path workspace) throws IOException {
        Path events = workspace.resolve(EVENT_FILE);
        if (!Files.exists(events)) {
            throw new IllegalStateException("Arquivo de eventos de visualização não foi criado.");
        }
        String warning = readStatus(workspace);
        return new Result(parse(Files.readAllLines(events, StandardCharsets.UTF_8), false), warning != null, warning);
    }

    /**
     * Best-effort read of the trace of a run that crashed or was killed. The last line may have been
     * cut mid-write, so an unparseable final line is dropped instead of discarding the whole trace.
     */
    static Result readPartialEvents(Path workspace) {
        try {
            Path events = workspace.resolve(EVENT_FILE);
            if (!Files.exists(events)) return new Result(List.of(), false, null);
            List<ExecutionEventDTO> parsed = parse(Files.readAllLines(events, StandardCharsets.UTF_8), true);
            return new Result(parsed, true, readStatus(workspace));
        } catch (IOException | RuntimeException e) {
            return new Result(List.of(), false, null);
        }
    }

    private static String readStatus(Path workspace) throws IOException {
        Path status = workspace.resolve(STATUS_FILE);
        if (!Files.exists(status)) return null;
        String reason = Files.readString(status, StandardCharsets.UTF_8).strip();
        return reason.isEmpty() ? "A visualização foi interrompida antes do fim da execução." : reason;
    }

    private static List<ExecutionEventDTO> parse(List<String> lines, boolean tolerateCutTail) throws IOException {
        List<ExecutionEventDTO> result = new ArrayList<>();
        long previousTime = 0;
        int lastContentLine = lines.size() - 1;
        while (lastContentLine >= 0 && lines.get(lastContentLine).isBlank()) lastContentLine--;

        for (int index = 0; index <= lastContentLine; index++) {
            String line = lines.get(index);
            if (line.isBlank()) continue;
            JsonNode parsed;
            try {
                parsed = JSON.readTree(line);
            } catch (JsonProcessingException e) {
                if (tolerateCutTail && index == lastContentLine) break;
                throw e;
            }
            ExecutionEventDTO typed = validate(parsed);
            if (typed.time() <= previousTime) throw invalidEvent();
            previousTime = typed.time();
            result.add(typed);
        }
        return List.copyOf(result);
    }

    private static ExecutionEventDTO validate(JsonNode parsed) throws IOException {
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
        if (typed.line() < 1 || typed.path().isBlank() || typed.value() == null) throw invalidEvent();
        return typed;
    }

    private static IllegalStateException invalidEvent() {
        return new IllegalStateException("Evento de visualização viola o contrato av.event.v1.");
    }
}
