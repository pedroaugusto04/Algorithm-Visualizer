package com.pedro.algorithm_visualizer.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;

import com.pedro.algorithm_visualizer.models.DTO.ExecutionErrorCode;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionErrorDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionEventDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionStage;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionResponseDTO;

@Service
public class CodeService {
    private static final long MAX_INPUT_BYTES = 1024L * 1024L;
    private static final long MAX_CODE_BYTES = 200_000L;

    private final ContainerStepRunner stepRunner;

    public CodeService(ContainerStepRunner stepRunner) {
        this.stepRunner = stepRunner;
    }
    public ExecutionResponseDTO execute(
            String language,
            String code,
            String testcase
    ) {
        Path workspace = null;
        long startedAt = System.nanoTime();
        ExecutionStage stage = ExecutionStage.VALIDATION;
        Integer exitCode = null;
        String stdout = "";
        String stderr = "";
        try {
            if (code == null || code.isBlank()) throw new IllegalArgumentException("Código-fonte vazio.");
            if (code.getBytes(StandardCharsets.UTF_8).length > MAX_CODE_BYTES) {
                throw new IllegalArgumentException("Código excede o limite de 200000 bytes.");
            }
            String input = testcase == null ? "" : testcase;
            if (input.getBytes(StandardCharsets.UTF_8).length > MAX_INPUT_BYTES) {
                throw new IllegalArgumentException("Input excede o limite de 1 MiB");
            }
            String standard = resolveStandard(language);
            stage = ExecutionStage.INTERNAL;
            workspace = Files.createTempDirectory("algo-run-");
            Files.writeString(
                    workspace.resolve("main.cpp"),
                    code,
                    StandardCharsets.UTF_8
            );
            Path testcasePath = workspace.resolve("testcase.txt");
            Files.writeString(testcasePath, input, StandardCharsets.UTF_8);

            stage = ExecutionStage.INSTRUMENTATION;
            ContainerStepRunner.StepResult instrumentationResult = stepRunner.run(workspace, "instrument", standard);
            Files.writeString(workspace.resolve("instrumented.cpp"), instrumentationResult.stdout());

            stage = ExecutionStage.COMPILATION;
            ContainerStepRunner.StepResult compilationResult = stepRunner.run(workspace, "compile", standard);
            stderr = compilationResult.stderr();

            stage = ExecutionStage.EXECUTION;
            ContainerStepRunner.StepResult executionResult = stepRunner.run(workspace, "execute", standard);
            stdout = executionResult.stdout();
            stderr = joinDiagnostics(stderr, executionResult.stderr());
            exitCode = 0;

            stage = ExecutionStage.TELEMETRY;
            List<ExecutionEventDTO> events = VisualizationTelemetry.readCompleteEvents(workspace);
            return new ExecutionResponseDTO(ExecutionResponseDTO.SCHEMA, true, ExecutionStage.COMPLETED,
                    stdout, stderr, exitCode, elapsedMs(startedAt), events, null);

        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            if (message.isBlank()) message = e.getClass().getSimpleName();
            if (e instanceof ContainerStepRunner.StepFailure failure) {
                if (!failure.stdout().isBlank()) stdout = failure.stdout();
                stderr = joinDiagnostics(stderr, failure.stderr());
                exitCode = failure.exitCode();
                stage = switch (failure.mode()) {
                    case "instrument" -> ExecutionStage.INSTRUMENTATION;
                    case "compile" -> ExecutionStage.COMPILATION;
                    default -> ExecutionStage.EXECUTION;
                };
            }
            ExecutionErrorCode errorCode = errorCode(stage, message);
            if (message.startsWith("TIMEOUT:")) {
                errorCode = ExecutionErrorCode.TIMEOUT;
            }
            if (message.startsWith("TIMEOUT:")) message = message.substring("TIMEOUT:".length()).trim();
            if (message.isBlank()) message = "The execution failed without diagnostic details.";
            return new ExecutionResponseDTO(ExecutionResponseDTO.SCHEMA, false, stage,
                    stdout, stderr, exitCode, elapsedMs(startedAt), List.of(), new ExecutionErrorDTO(errorCode, message));
        } finally {
            if (workspace != null) {
                try {
                    deleteRecursively(workspace);
                } catch (IOException ignored) {
                    // best effort cleanup
                }
            }
        }
    }

    private long elapsedMs(long startedAt) {
        return Math.max(0, (System.nanoTime() - startedAt) / 1_000_000);
    }

    private String joinDiagnostics(String compilation, String execution) {
        if (compilation.isBlank()) return execution;
        if (execution.isBlank()) return compilation;
        return compilation.stripTrailing() + "\n" + execution;
    }

    private ExecutionErrorCode errorCode(ExecutionStage stage, String message) {
        if (stage == ExecutionStage.VALIDATION || message.startsWith("Padrão C++ não suportado")) {
            return ExecutionErrorCode.VALIDATION_ERROR;
        }
        if (stage == ExecutionStage.INSTRUMENTATION) return ExecutionErrorCode.INSTRUMENTATION_ERROR;
        if (stage == ExecutionStage.COMPILATION) return ExecutionErrorCode.COMPILATION_ERROR;
        if (stage == ExecutionStage.TELEMETRY) return ExecutionErrorCode.TELEMETRY_ERROR;
        if (stage == ExecutionStage.EXECUTION) return ExecutionErrorCode.EXECUTION_ERROR;
        return ExecutionErrorCode.INTERNAL_ERROR;
    }

    private String resolveStandard(String language) {
        String normalized = language == null ? "" : language.trim().toLowerCase(Locale.ROOT);
        normalized = normalized.replace(" ", "");
        if (normalized.equals("cpp23") || normalized.equals("gnu++23") || normalized.equals("c++23")) {
            return "gnu++23";
        }
        if (normalized.equals("cpp20") || normalized.equals("gnu++20") || normalized.equals("c++20")) {
            return "gnu++20";
        }
        if (normalized.equals("cpp17") || normalized.equals("gnu++17") || normalized.equals("c++17")) {
            return "gnu++17";
        }
        throw new IllegalArgumentException("Padrão C++ não suportado: " + language);
    }

    private void deleteRecursively(Path root) throws IOException {
        if (!Files.exists(root)) {
            return;
        }

        try (Stream<Path> walk = Files.walk(root)) {
            for (Path current : walk.sorted((a, b) -> b.compareTo(a)).toList()) {
                Files.deleteIfExists(current);
            }
        }
    }
}
