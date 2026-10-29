export interface ExecutionLogEntry {
  schema: 'av.event.v1';
  time: number;
  type: 'map' | 'array';
  path: string;
  op: 'init' | 'snapshot';
  line: number;
  value: JsonValue;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
