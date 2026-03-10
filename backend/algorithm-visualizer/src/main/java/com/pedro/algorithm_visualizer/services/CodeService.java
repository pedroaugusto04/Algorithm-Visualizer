package com.pedro.algorithm_visualizer.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.pedro.algorithm_visualizer.models.DTO.ExecutionResponseDTO;

@Service
public class CodeService {

    private record CompileProfile(String compiler, List<String> flags) {
    }

    public ExecutionResponseDTO execute(
            String language,
            String code,
            String testcase,
            String functionName,
            MultipartFile inputFile
    ) {
        try {
            Path workspace = Files.createTempDirectory("algo-run-");

            // formata o codigo pra evitar problemas com quebras de linha e caracteres indesejados
            String normalizedCode = code.replace("\\n\"", "___PROTECTED_N_QUOTE___");
            normalizedCode = normalizedCode.replace("'\\n'", "___PROTECTED_N_CHAR___");
            normalizedCode = normalizedCode.replace("\\n", "\n");
            normalizedCode = normalizedCode.replace("___PROTECTED_N_QUOTE___", "\\n\"");
            normalizedCode = normalizedCode.replace("___PROTECTED_N_CHAR___", "'\\n'");
            normalizedCode = normalizedCode.replace("\r", "");

            Files.writeString(
                    workspace.resolve("main.cpp"),
                    normalizedCode,
                    StandardCharsets.UTF_8
            );

            Path instrumenterSource = resolveSourcePath("instrumenter.py");
            Path instrumentationSource = resolveSourcePath("instrumentation");

            Files.copy(instrumenterSource,
                    workspace.resolve("instrumenter.py"),
                    StandardCopyOption.REPLACE_EXISTING);
            copyRecursively(
                    instrumentationSource,
                    workspace.resolve("instrumentation")
            );

            Path testcasePath;

            if (inputFile != null && !inputFile.isEmpty()) {
                String name = inputFile.getOriginalFilename();
                if (name == null || name.isBlank()) name = "input.txt";
                testcasePath = workspace.resolve(name);
                Files.copy(inputFile.getInputStream(), testcasePath);
            } else {
                testcasePath = workspace.resolve("testcase.txt");
                Files.writeString(testcasePath, testcase == null ? "" : testcase);
            }

            try {
                String instrumented = runStep(
                        workspace,
                        buildInstrumentationCommand(language, testcasePath, functionName)
                );

                Files.writeString(workspace.resolve("instrumented.cpp"), instrumented);

                String output = runStep(
                        workspace,
                        buildCompileAndRunCommand(language, "instrumented.cpp", testcasePath, inputFile)
                );

                return new ExecutionResponseDTO(true, output, "Code executed successfully!", null);
            } catch (Exception instrumentationError) {
                try {
                    String fallbackOutput = runStep(
                            workspace,
                            buildCompileAndRunCommand(language, "main.cpp", testcasePath, inputFile)
                    );

                    return new ExecutionResponseDTO(
                            true,
                            fallbackOutput,
                            "Code executed without visualization (instrumentation fallback).",
                            null
                    );
                } catch (Exception fallbackError) {
                    String message = "Erro na instrumentacao: "
                            + instrumentationError.getMessage()
                            + " | Erro no fallback: "
                            + fallbackError.getMessage();
                    return new ExecutionResponseDTO(false, null, "Erro: " + message, null);
                }
            }

        } catch (Exception e) {
            return new ExecutionResponseDTO(false, null, "Erro: " + e.getMessage(), null);
        }
    }

    private String runStep(Path workspace, String shellCommand) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", "--rm",
                "-v", workspace.toAbsolutePath() + ":/work",
                "pedroaug4/algo-runner:latest",
                "sh", "-c", shellCommand
        );

        Process p = pb.start();
        String stdout = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String stderr = new String(p.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);

        int exitCode = p.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Erro no processo (Exit " + exitCode + "): " + stderr);
        }
        return stdout;
    }

    private String buildCompileAndRunCommand(
            String language,
            String sourceFileName,
            Path testcasePath,
            MultipartFile inputFile
    ) {
        CompileProfile profile = resolveCompileProfile(language);

        StringBuilder compileCommand = new StringBuilder();
        compileCommand.append(profile.compiler()).append(" ");
        if (profile.flags() != null && !profile.flags().isEmpty()) {
            compileCommand.append(String.join(" ", profile.flags())).append(" ");
        }
        compileCommand
                .append(shellQuote("/work/" + sourceFileName))
                .append(" -o ")
                .append(shellQuote("/work/run"));

        String runCommand = "/work/run";
        if (inputFile != null && !inputFile.isEmpty() && Files.exists(testcasePath)) {
            runCommand += " < " + shellQuote("/work/" + testcasePath.getFileName());
        }

        return compileCommand + " && " + runCommand;
    }

    private String buildInstrumentationCommand(
            String language,
            Path testcasePath,
            String functionName
    ) {
        StringBuilder command = new StringBuilder();
        command
                .append("python3 ")
                .append(shellQuote("/work/instrumenter.py"))
                .append(" ")
                .append(shellQuote("/work/main.cpp"))
                .append(" ")
                .append(shellQuote("/work/" + testcasePath.getFileName()))
                .append(" ")
                .append(shellQuote(functionName == null ? "" : functionName))
                .append(" ")
                .append(shellQuote(resolveClangStandard(language)));
        return command.toString();
    }

    private CompileProfile resolveCompileProfile(String language) {
        String normalized = language == null ? "" : language.trim().toLowerCase(Locale.ROOT);
        normalized = normalized.replace(" ", "");

        if (normalized.contains("23")) {
            return new CompileProfile(
                    "g++",
                    Arrays.asList("-std=gnu++23", "-O2", "-pipe", "-Wall", "-Wextra")
            );
        }

        if (normalized.contains("20")) {
            return new CompileProfile(
                    "g++",
                    Arrays.asList("-std=gnu++20", "-O2", "-pipe", "-Wall", "-Wextra")
            );
        }

        return new CompileProfile(
                "g++",
                Arrays.asList("-std=gnu++17", "-O2", "-pipe", "-Wall", "-Wextra")
        );
    }

    private String resolveClangStandard(String language) {
        String normalized = language == null ? "" : language.trim().toLowerCase(Locale.ROOT);
        normalized = normalized.replace(" ", "");

        if (normalized.contains("23")) {
            return "gnu++23";
        }
        if (normalized.contains("20")) {
            return "gnu++20";
        }
        return "gnu++17";
    }

    private String shellQuote(String raw) {
        if (raw == null) {
            return "''";
        }
        return "'" + raw.replace("'", "'\"'\"'") + "'";
    }

    private Path resolveSourcePath(String relativePath) throws IOException {
        Path direct = Paths.get(relativePath);
        if (Files.exists(direct)) {
            return direct;
        }

        Path monorepo = Paths.get("backend", "algorithm-visualizer", relativePath);
        if (Files.exists(monorepo)) {
            return monorepo;
        }

        throw new IOException(
                "Recurso nao encontrado: " + relativePath + " (cwd: " + Paths.get("").toAbsolutePath() + ")"
        );
    }

    private void copyRecursively(Path source, Path target) throws IOException {
        try (Stream<Path> paths = Files.walk(source)) {
            for (Path path : paths.toList()) {
                Path relative = source.relativize(path);
                Path destination = target.resolve(relative);

                if (Files.isDirectory(path)) {
                    Files.createDirectories(destination);
                } else {
                    Path parent = destination.getParent();
                    if (parent != null) {
                        Files.createDirectories(parent);
                    }
                    Files.copy(path, destination, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        }
    }
}
