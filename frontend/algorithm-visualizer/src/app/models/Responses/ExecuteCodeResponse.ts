import type { ExecutionLogEntry } from '../ExecutionLogEntry';

export const EXECUTION_STAGES = [
  'completed', 'validation', 'instrumentation', 'compilation', 'execution', 'telemetry', 'internal'
] as const;
export type ExecutionStage = typeof EXECUTION_STAGES[number];

export const EXECUTION_ERROR_CODES = [
  'validation_error', 'instrumentation_error', 'compilation_error', 'execution_error',
  'timeout', 'telemetry_error', 'internal_error'
] as const;
export type ExecutionErrorCode = typeof EXECUTION_ERROR_CODES[number];

export interface ExecuteCodeResponse {
  schema: 'av.execution.v1';
  success: boolean;
  stage: ExecutionStage;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  events: ExecutionLogEntry[];
  error: { code: ExecutionErrorCode; message: string } | null;
  /** True when events is a partial trace (budget reached, crash or timeout). */
  truncated?: boolean;
  /** Non-fatal visualization warnings from the runtime. */
  warnings?: string[];
}
