package com.pedro.algorithm_visualizer.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.pedro.algorithm_visualizer.models.DTO.ExecutionErrorCode;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionErrorDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionEventDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionStage;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionResponseDTO;

@Service
public class CodeService {
    private static final long MAX_INPUT_BYTES = 4 * 1024L * 1024L;
    private static final long MAX_CODE_BYTES = 500_000L;
    private static final long QUEUE_WAIT_SECONDS = 60;

    private final ContainerStepRunner stepRunner;
    /** Bounds simultaneous container pipelines; each run can use up to 4 GB while instrumenting. */
    private final Semaphore runSlots;

    @Autowired
    public CodeService(
            ContainerStepRunner stepRunner,
            @Value("${av.execution.max-concurrent:2}") int maxConcurrentRuns
    ) {
        this.stepRunner = stepRunner;
        this.runSlots = new Semaphore(Math.max(1, maxConcurrentRuns), true);
    }

    /** Test-only constructor: skips Spring property injection. */
    CodeService(ContainerStepRunner stepRunner) {
        this(stepRunner, 2);
    }

    public ExecutionResponseDTO execute(String language, String code, String testcase) {
        Path workspace = null;
        long startedAt = System.nanoTime();
        ExecutionStage stage = ExecutionStage.VALIDATION;
        Integer exitCode = null;
        String stdout = "";
        String stderr = "";
        boolean holdsSlot = false;
        try {
            if (code == null || code.isBlank()) throw new IllegalArgumentException("Código-fonte vazio.");
            if (code.getBytes(StandardCharsets.UTF_8).length > MAX_CODE_BYTES)
                throw new IllegalArgumentException("Código excede o limite de 200000 bytes.");
            String input = testcase == null ? "" : testcase;
            if (input.getBytes(StandardCharsets.UTF_8).length > MAX_INPUT_BYTES)
                throw new IllegalArgumentException("Input excede o limite de 1 MiB");

            String standard = resolveStandard(language);
            stage = ExecutionStage.INTERNAL;

            holdsSlot = runSlots.tryAcquire(QUEUE_WAIT_SECONDS, TimeUnit.SECONDS);
            if (!holdsSlot)
                throw new IllegalStateException("Servidor ocupado com outras execuções. Tente novamente em instantes.");

            workspace = Files.createTempDirectory("algo-run-");
            workspace.toFile().setReadable(true, false);
            workspace.toFile().setWritable(true, false);
            workspace.toFile().setExecutable(true, false);
            Path mainCpp = Files.writeString(workspace.resolve("main.cpp"), code, StandardCharsets.UTF_8);
            mainCpp.toFile().setReadable(true, false);
            mainCpp.toFile().setWritable(true, false);
            Path testCase = Files.writeString(workspace.resolve("testcase.txt"), input, StandardCharsets.UTF_8);
            testCase.toFile().setReadable(true, false);
            testCase.toFile().setWritable(true, false);

            stage = ExecutionStage.INSTRUMENTATION;
            ContainerStepRunner.StepResult instrumented = stepRunner.run(workspace, "instrument", standard);
            Path instr = Files.writeString(workspace.resolve("instrumented.cpp"), instrumented.stdout());
            instr.toFile().setReadable(true, false);
            instr.toFile().setWritable(true, false);

            stage = ExecutionStage.COMPILATION;
            stderr = stepRunner.run(workspace, "compile", standard).stderr();

            stage = ExecutionStage.EXECUTION;
            ContainerStepRunner.StepResult executed = stepRunner.run(workspace, "execute", standard);
            stdout = executed.stdout();
            stderr = joinDiagnostics(stderr, executed.stderr());
            exitCode = 0;

            stage = ExecutionStage.TELEMETRY;
            VisualizationTelemetry.Result telemetry = VisualizationTelemetry.readEvents(workspace);
            List<String> warnings = telemetry.warning() != null ? List.of(telemetry.warning()) : List.of();
            return new ExecutionResponseDTO(
                    ExecutionResponseDTO.SCHEMA, true, ExecutionStage.COMPLETED,
                    stdout, stderr, exitCode, elapsedMs(startedAt),
                    telemetry.events(), null, telemetry.truncated(), warnings);

        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            if (message.isBlank()) message = e.getClass().getSimpleName();

            if (e instanceof ContainerStepRunner.StepTimeout timeout) {
                if (!timeout.stdout().isBlank()) stdout = timeout.stdout();
                stderr = joinDiagnostics(stderr, timeout.stderr());
            }
            if (e instanceof ContainerStepRunner.StepFailure failure) {
                if (!failure.stdout().isBlank()) stdout = failure.stdout();
                stderr = joinDiagnostics(stderr, failure.stderr());
                exitCode = failure.exitCode();
                stage = switch (failure.mode()) {
                    case "instrument" -> ExecutionStage.INSTRUMENTATION;
                    case "compile"    -> ExecutionStage.COMPILATION;
                    default           -> ExecutionStage.EXECUTION;
                };
            }

            ExecutionErrorCode errorCode = errorCode(stage, message);
            if (message.startsWith("TIMEOUT:")) {
                errorCode = ExecutionErrorCode.TIMEOUT;
                message = message.substring("TIMEOUT:".length()).trim();
            }
            if (message.isBlank()) message = "The execution failed without diagnostic details.";

            // A crash or timeout is exactly when a partial trace is most useful.
            List<ExecutionEventDTO> events = List.of();
            List<String> warnings = new ArrayList<>();
            boolean truncated = false;
            if (stage == ExecutionStage.EXECUTION && workspace != null) {
                VisualizationTelemetry.Result partial = VisualizationTelemetry.readPartialEvents(workspace);
                events = partial.events();
                truncated = !events.isEmpty();
                if (partial.warning() != null) warnings.add(partial.warning());
                if (!events.isEmpty())
                    warnings.add("A execução não terminou normalmente; a visualização mostra os passos registrados até a falha.");
            }
            return new ExecutionResponseDTO(
                    ExecutionResponseDTO.SCHEMA, false, stage,
                    stdout, stderr, exitCode, elapsedMs(startedAt),
                    events, new ExecutionErrorDTO(errorCode, message), truncated, warnings);

        } finally {
            if (holdsSlot) runSlots.release();
            if (workspace != null) {
                try { deleteRecursively(workspace); } catch (IOException ignored) {}
            }
        }
    }

    private long elapsedMs(long startedAt) {
        return Math.max(0, (System.nanoTime() - startedAt) / 1_000_000);
    }

    private String joinDiagnostics(String a, String b) {
        if (a.isBlank()) return b;
        if (b.isBlank()) return a;
        return a.stripTrailing() + "\n" + b;
    }

    private ExecutionErrorCode errorCode(ExecutionStage stage, String message) {
        if (stage == ExecutionStage.VALIDATION || message.startsWith("Padrão C++ não suportado"))
            return ExecutionErrorCode.VALIDATION_ERROR;
        if (stage == ExecutionStage.INSTRUMENTATION) return ExecutionErrorCode.INSTRUMENTATION_ERROR;
        if (stage == ExecutionStage.COMPILATION)     return ExecutionErrorCode.COMPILATION_ERROR;
        if (stage == ExecutionStage.TELEMETRY)       return ExecutionErrorCode.TELEMETRY_ERROR;
        if (stage == ExecutionStage.EXECUTION)       return ExecutionErrorCode.EXECUTION_ERROR;
        return ExecutionErrorCode.INTERNAL_ERROR;
    }

    private String resolveStandard(String language) {
        String n = language == null ? "" : language.trim().toLowerCase(Locale.ROOT).replace(" ", "");
        if (n.equals("cpp23") || n.equals("gnu++23") || n.equals("c++23")) return "gnu++23";
        if (n.equals("cpp20") || n.equals("gnu++20") || n.equals("c++20")) return "gnu++20";
        if (n.equals("cpp17") || n.equals("gnu++17") || n.equals("c++17")) return "gnu++17";
        throw new IllegalArgumentException("Padrão C++ não suportado: " + language);
    }

    private void deleteRecursively(Path root) throws IOException {
        if (!Files.exists(root)) return;
        try (Stream<Path> walk = Files.walk(root)) {
            for (Path p : walk.sorted((a, b) -> b.compareTo(a)).toList())
                Files.deleteIfExists(p);
        }
    }
}
