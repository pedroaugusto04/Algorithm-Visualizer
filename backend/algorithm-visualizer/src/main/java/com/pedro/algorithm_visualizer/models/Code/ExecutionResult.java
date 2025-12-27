package com.pedro.algorithm_visualizer.models.Code;

public class ExecutionResult {

    private final int exitCode;
    private final String executionLogs;
    private final String systemLogs;

    public ExecutionResult(int exitCode, String executionLogs, String systemLogs) {
        this.exitCode = exitCode;
        this.executionLogs = executionLogs;
        this.systemLogs = systemLogs;
    }

    public boolean isSuccess() {
        return exitCode == 0;
    }

    public int getExitCode() {
        return exitCode;
    }

    public String getExecutionLogs() {
        return executionLogs;
    }

    public String getSystemLogs() {
        return systemLogs;
    }
}
