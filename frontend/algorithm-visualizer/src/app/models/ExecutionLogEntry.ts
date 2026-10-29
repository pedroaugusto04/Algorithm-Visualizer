export interface ExecutionLogEntry {
  schema: 'av.event.v2';
  time: number;
  type: string;
  path: string;
  op: 'init' | 'snapshot' | 'exit';
  line: number;
  frame?: number;
  func?: string;
  depth?: number;
  value: JsonValue;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
