package com.pedro.algorithm_visualizer.services;

import com.pedro.algorithm_visualizer.models.DTO.CodeRequestDTO;
import com.pedro.algorithm_visualizer.models.DTO.ExecutionResponseDTO;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;

@Service
public class CodeService {

    public ExecutionResponseDTO execute(CodeRequestDTO dto) {
        Path workspace = null;
        try {
            workspace = Files.createTempDirectory("algo-run-");

            Path userCode = workspace.resolve("main.cpp");
            Files.writeString(userCode, dto.code());
            Files.copy(Paths.get("instrumenter.py"), workspace.resolve("instrumenter.py"), StandardCopyOption.REPLACE_EXISTING);

            String instrumentedCode = runStep(workspace, "python3 /work/instrumenter.py /work/main.cpp");
            Files.writeString(workspace.resolve("instrumented.cpp"), instrumentedCode);

            String resultOutput = runStep(workspace, "g++ /work/instrumented.cpp -o /work/run && /work/run");

            return new ExecutionResponseDTO(true, resultOutput, "Code executed successfully!", null);

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
        String stdout = new String(p.getInputStream().readAllBytes());
        String stderr = new String(p.getErrorStream().readAllBytes());

        if (p.waitFor() != 0) {
            throw new RuntimeException(stderr);
        }
        return stdout;
    }
}