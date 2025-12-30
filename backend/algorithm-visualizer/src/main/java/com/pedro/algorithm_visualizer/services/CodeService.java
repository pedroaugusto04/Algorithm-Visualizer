package com.pedro.algorithm_visualizer.services;

import com.pedro.algorithm_visualizer.models.DTO.CodeRequestDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;

@Service
public class CodeService {

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

            Files.copy(Paths.get("instrumenter.py"),
                    workspace.resolve("instrumenter.py"),
                    StandardCopyOption.REPLACE_EXISTING);

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

            String instrumented = runStep(
                    workspace,
                    "python3 /work/instrumenter.py /work/main.cpp /work/" + testcasePath.getFileName() + " " + functionName
            );

            Files.writeString(workspace.resolve("instrumented.cpp"), instrumented);

            String runCommand = "g++ /work/instrumented.cpp -o /work/run && /work/run";
            if (inputFile != null && !inputFile.isEmpty() && Files.exists(testcasePath)) {
                runCommand += " < /work/" + testcasePath.getFileName();
            }

            String output = runStep(
                    workspace,runCommand
            );

            return new ExecutionResponseDTO(true, output, "Code executed successfully!", null);

        } catch (Exception e) {
            return new ExecutionResponseDTO(false, null, "Erro: " + e.getMessage(), null);
        }
    }

    private String runStep(Path workspace, String shellCommand) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", "--rm",
                "-v", workspace.toAbsolutePath() + ":/work",
                "algo-runner",
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
}