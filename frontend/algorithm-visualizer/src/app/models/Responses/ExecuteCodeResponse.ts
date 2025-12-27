export interface ExecuteCodeResponse {
  success: boolean;
  executionLogs: string; 
  systemLogs: string;
  error: string | null;
}