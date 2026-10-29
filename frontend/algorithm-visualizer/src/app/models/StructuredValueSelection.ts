import type { JsonValue } from './ExecutionLogEntry';

export interface StructuredValueSelection {
  path: string;
  value: JsonValue;
  previousValue?: JsonValue;
  hasPrevious: boolean;
}
