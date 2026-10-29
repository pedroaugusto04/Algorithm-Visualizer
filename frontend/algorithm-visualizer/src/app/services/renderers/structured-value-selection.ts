import type { JsonValue } from '../../models/ExecutionLogEntry';
import type { StructuredValueSelection } from '../../models/StructuredValueSelection';

export interface StructuredSelectionContext {
  selectedValuePath?: string;
  selectedValueSnapshot?: JsonValue;
  onStructuredValueSelected?: (selection: StructuredValueSelection | null) => void;
}

export interface SelectableStructuredValue {
  path: string;
  value: unknown;
}

export function isStructuredValue(value: unknown): value is JsonValue[] | { [key: string]: JsonValue } {
  return value !== null && typeof value === 'object';
}

export function cloneJsonValue(value: JsonValue): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export function toggleStructuredSelection(
  context: StructuredSelectionContext,
  candidate: SelectableStructuredValue
): void {
  if (context.selectedValuePath === candidate.path) {
    context.selectedValuePath = undefined;
    context.selectedValueSnapshot = undefined;
    context.onStructuredValueSelected?.(null);
    return;
  }

  if (!isStructuredValue(candidate.value)) return;
  context.selectedValuePath = candidate.path;
  context.selectedValueSnapshot = cloneJsonValue(candidate.value);
  context.onStructuredValueSelected?.({
    path: candidate.path,
    value: candidate.value,
    hasPrevious: false
  });
}

export function refreshStructuredSelection(
  context: StructuredSelectionContext,
  candidates: SelectableStructuredValue[]
): void {
  const path = context.selectedValuePath;
  if (!path) {
    context.onStructuredValueSelected?.(null);
    return;
  }

  const selected = candidates.find(candidate => candidate.path === path);
  if (!selected || !isStructuredValue(selected.value)) {
    context.selectedValuePath = undefined;
    context.selectedValueSnapshot = undefined;
    context.onStructuredValueSelected?.(null);
    return;
  }

  const previousValue = context.selectedValueSnapshot;
  context.onStructuredValueSelected?.({
    path,
    value: selected.value,
    previousValue,
    hasPrevious: previousValue !== undefined
  });
  context.selectedValueSnapshot = cloneJsonValue(selected.value);
}
