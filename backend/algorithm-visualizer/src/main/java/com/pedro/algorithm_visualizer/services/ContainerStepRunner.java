package com.pedro.algorithm_visualizer.services;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Component;

@Component
class ContainerStepRunner {
    private static final int MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
    private static final long PREPARATION_TIMEOUT_SECONDS = 60;
    private final long timeoutSeconds;

    ContainerStepRunner() { this(20); }

    ContainerStepRunner(long timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }

    record StepResult(String stdout, String stderr) {}

    static final class StepFailure extends IllegalStateException {
        private final String mode;
        private final int exitCode;
        private final String stdout;
        private final String stderr;

        StepFailure(String mode, int exitCode, String stdout, String stderr) {
            super("Process terminated during " + mode + " with exit code " + exitCode);
            this.mode = mode;
            this.exitCode = exitCode;
            this.stdout = stdout;
            this.stderr = stderr;
        }

        String mode() { return mode; }
        int exitCode() { return exitCode; }
        String stdout() { return stdout; }
        String stderr() { return stderr; }
    }

    StepResult run(Path workspace, String mode, String standard) throws IOException, InterruptedException {
        if (!mode.equals("instrument") && !mode.equals("compile") && !mode.equals("execute")) {
            throw new IllegalArgumentException("Etapa do runner inválida: " + mode);
        }
        String memoryLimit = switch (mode) {
            case "instrument" -> "2g";
            case "compile" -> "1g";
            default -> "256m";
        };
        Process process = new ProcessBuilder(
                "docker", "run", "--rm", "--network", "none", "--cpus", "1",
                "--memory", memoryLimit, "--pids-limit", "256",
                "--security-opt", "no-new-privileges", "--cap-drop", "ALL",
                "-v", workspace.toAbsolutePath() + ":/work",
                "-e", "AV_EVENT_FILE=/work/events.jsonl",
                "-e", "AV_STATUS_FILE=/work/visualization.status",
                "pedroaug4/algo-runner:latest", mode, standard
        ).start();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor();
             InputStream stdoutStream = process.getInputStream();
             InputStream stderrStream = process.getErrorStream()) {
            Future<String> stdout = executor.submit(() -> readAll(stdoutStream));
            Future<String> stderr = executor.submit(() -> readAll(stderrStream));
            long stepTimeout = mode.equals("execute") ? timeoutSeconds : PREPARATION_TIMEOUT_SECONDS;
            if (!process.waitFor(stepTimeout, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                throw new IllegalStateException("TIMEOUT: Tempo limite excedido (" + stepTimeout + "s)");
            }
            try {
                StepResult result = new StepResult(stdout.get(), stderr.get());
                if (process.exitValue() != 0) {
                    throw new StepFailure(mode, process.exitValue(), result.stdout(), result.stderr());
                }
                return result;
            } catch (ExecutionException e) {
                throw new IOException("Falha ao coletar saída do processo", e.getCause());
            }
        }
    }

    private String readAll(InputStream stream) throws IOException {
        var output = new java.io.ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count;
        boolean truncated = false;
        while ((count = stream.read(buffer)) != -1) {
            int remaining = MAX_OUTPUT_BYTES - output.size();
            if (remaining > 0) output.write(buffer, 0, Math.min(count, remaining));
            if (count > remaining) truncated = true;
        }
        String value = output.toString(StandardCharsets.UTF_8);
        return truncated ? value + "\n[stream truncated: 2 MiB limit]" : value;
    }
}
