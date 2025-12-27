export interface ExecutionLogEntry {
  time: number;
  type: 'map' | 'vector' | 'queue' | 'stack' | string;
  path: string;
  op: 'init' | 'add' | 'update' | 'remove' | string;
  value?: any;
}