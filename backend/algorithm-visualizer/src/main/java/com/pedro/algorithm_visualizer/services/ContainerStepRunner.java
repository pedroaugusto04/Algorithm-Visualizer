package com.pedro.algorithm_visualizer.services;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Component;

@Component
class ContainerStepRunner {
    private static final int MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
    private static final long DEFAULT_PREPARATION_TIMEOUT_SECONDS = 120;
    private static final long DEFAULT_TIMEOUT_SECONDS = 60;
    private static final String DEFAULT_RUNNER_IMAGE = "pedroaug4/algo-runner:latest";
    private static final String DEFAULT_PULL_POLICY = "never";

    private final long timeoutSeconds;
    private final String runnerImage;
    private final String pullPolicy;

    ContainerStepRunner() {
        this(resolveTimeoutSeconds());
    }

    private static long resolveTimeoutSeconds() {
        String env = System.getenv("AV_TIMEOUT_SECONDS");
        if (env != null && !env.isBlank()) {
            try {
                return Long.parseLong(env.trim());
            } catch (NumberFormatException ignored) {}
        }
        return DEFAULT_TIMEOUT_SECONDS;
    }

    private static long resolvePreparationTimeoutSeconds() {
        String env = System.getenv("AV_PREPARATION_TIMEOUT_SECONDS");
        if (env != null && !env.isBlank()) {
            try {
                return Long.parseLong(env.trim());
            } catch (NumberFormatException ignored) {}
        }
        return DEFAULT_PREPARATION_TIMEOUT_SECONDS;
    }

    ContainerStepRunner(long timeoutSeconds) {
        this(
            timeoutSeconds,
            System.getenv().getOrDefault("AV_RUNNER_IMAGE", DEFAULT_RUNNER_IMAGE),
            System.getenv().getOrDefault("AV_RUNNER_PULL_POLICY", DEFAULT_PULL_POLICY)
        );
    }

    ContainerStepRunner(long timeoutSeconds, String runnerImage, String pullPolicy) {
        this.timeoutSeconds = timeoutSeconds;
        this.runnerImage = (runnerImage == null || runnerImage.isBlank()) ? DEFAULT_RUNNER_IMAGE : runnerImage.trim();
        this.pullPolicy = (pullPolicy == null || pullPolicy.isBlank()) ? DEFAULT_PULL_POLICY : pullPolicy.trim();
    }

    record StepResult(String stdout, String stderr) {}

    static final class StepFailure extends IllegalStateException {
        private final String mode;
        private final int exitCode;
        private final String stdout;
        private final String stderr;

        StepFailure(String mode, int exitCode, String stdout, String stderr) {
            this(mode, exitCode, stdout, stderr, DEFAULT_RUNNER_IMAGE);
        }

        StepFailure(String mode, int exitCode, String stdout, String stderr, String runnerImage) {
            super(formatMessage(mode, exitCode, stderr, runnerImage));
            this.mode = mode;
            this.exitCode = exitCode;
            this.stdout = stdout;
            this.stderr = stderr;
        }

        private static String formatMessage(String mode, int exitCode, String stderr, String runnerImage) {
            if (exitCode == 125 && stderr != null && (stderr.contains("No such image") || stderr.contains("not found"))) {
                return "Imagem do runner não encontrada no Docker ('" + runnerImage + "'). Construa-a executando: " +
                        "docker compose -f docker-compose.prod.yml build runner (ou: docker build -t " + runnerImage +
                        " -f backend/algorithm-visualizer/Dockerfile-Instrumenter backend/algorithm-visualizer)";
            }
            return "Process terminated during " + mode + " with exit code " + exitCode;
        }

        String mode() { return mode; }
        int exitCode() { return exitCode; }
        String stdout() { return stdout; }
        String stderr() { return stderr; }
    }

    /** Raised when a step exceeds its time limit; keeps the output produced until the container was killed. */
    static final class StepTimeout extends IllegalStateException {
        private final String mode;
        private final String stdout;
        private final String stderr;

        StepTimeout(String mode, long seconds, String stdout, String stderr) {
            super("TIMEOUT: Tempo limite excedido (" + seconds + "s)");
            this.mode = mode;
            this.stdout = stdout;
            this.stderr = stderr;
        }

        String mode() { return mode; }
        String stdout() { return stdout; }
        String stderr() { return stderr; }
    }

    StepResult run(Path workspace, String mode, String standard) throws IOException, InterruptedException {
        if (!mode.equals("instrument") && !mode.equals("compile") && !mode.equals("execute")) {
            throw new IllegalArgumentException("Etapa do runner inválida: " + mode);
        }
        String memoryLimit = switch (mode) {
            case "instrument" -> System.getenv().getOrDefault("AV_MEMORY_INSTRUMENT", "4g");
            case "compile" -> System.getenv().getOrDefault("AV_MEMORY_COMPILE", "2g");
            default -> System.getenv().getOrDefault("AV_MEMORY_EXECUTE", "1g");
        };
        String cpuLimit = System.getenv().getOrDefault("AV_CPUS", "2");
        String pidsLimit = System.getenv().getOrDefault("AV_PIDS_LIMIT", "512");
        // Named so a timeout can kill the container itself: killing the docker CLI with SIGKILL is not
        // forwarded to the container, which would otherwise keep running (and consuming CPU) orphaned.
        String containerName = "av-" + mode + "-" + UUID.randomUUID();
        Process process = new ProcessBuilder(
                "docker", "run", "--pull", pullPolicy, "--rm", "--name", containerName, "--network", "none", "--cpus", cpuLimit,
                "--memory", memoryLimit, "--pids-limit", pidsLimit,
                "--security-opt", "no-new-privileges", "--cap-drop", "ALL",
                "-v", workspace.toAbsolutePath() + ":/work",
                "-e", "AV_EVENT_FILE=/work/events.jsonl",
                "-e", "AV_STATUS_FILE=/work/visualization.status",
                runnerImage, mode, standard
        ).start();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor();
             InputStream stdoutStream = process.getInputStream();
             InputStream stderrStream = process.getErrorStream()) {
            Future<String> stdout = executor.submit(() -> readAll(stdoutStream));
            Future<String> stderr = executor.submit(() -> readAll(stderrStream));
            long stepTimeout = mode.equals("execute") ? timeoutSeconds : resolvePreparationTimeoutSeconds();
            if (!process.waitFor(stepTimeout, TimeUnit.SECONDS)) {
                killContainer(containerName);
                process.destroyForcibly();
                process.waitFor(5, TimeUnit.SECONDS);
                throw new StepTimeout(mode, stepTimeout, partialOutput(stdout), partialOutput(stderr));
            }
            try {
                StepResult result = new StepResult(stdout.get(), stderr.get());
                if (process.exitValue() != 0) {
                    throw new StepFailure(mode, process.exitValue(), result.stdout(), result.stderr(), runnerImage);
                }
                return result;
            } catch (ExecutionException e) {
                throw new IOException("Falha ao coletar saída do processo", e.getCause());
            }
        }
    }

    private void killContainer(String containerName) throws InterruptedException {
        try {
            Process kill = new ProcessBuilder("docker", "kill", containerName)
                    .redirectErrorStream(true)
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .start();
            if (!kill.waitFor(10, TimeUnit.SECONDS)) kill.destroyForcibly();
        } catch (IOException ignored) {
            // best effort: the container may have already exited
        }
    }

    private String partialOutput(Future<String> output) {
        try {
            return output.get(2, TimeUnit.SECONDS);
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            return "";
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
