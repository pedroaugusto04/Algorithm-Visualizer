import type { JsonValue } from '../../models/ExecutionLogEntry';

export type JsonValueNodeKind = 'object' | 'array' | 'value';

export interface JsonValueTreeNode {
  path: string;
  label: string;
  kind: JsonValueNodeKind;
  summary: string;
  displayValue: string;
  changed: boolean;
  removed: boolean;
  depth: number;
  children: JsonValueTreeNode[];
}

export function projectJsonValueTree(
  label: string,
  path: string,
  value: JsonValue,
  previousValue?: JsonValue,
  hasPrevious = false,
  depth = 0
): JsonValueTreeNode {
  if (Array.isArray(value)) {
    const previousArray = Array.isArray(previousValue) ? previousValue : [];
    const children = value.map((child, index) => projectJsonValueTree(
      `[${index}]`,
      `${path}[${index}]`,
      child,
      previousArray[index],
      hasPrevious && Array.isArray(previousValue) && index < previousArray.length,
      depth + 1
    ));

    if (hasPrevious && Array.isArray(previousValue) && previousArray.length > value.length) {
      for (let index = value.length; index < previousArray.length; index++) {
        children.push(removedNode(`[${index}]`, `${path}[${index}]`, previousArray[index], depth + 1));
      }
    }

    return {
      path, label, kind: 'array', summary: `[${value.length}]`, displayValue: '',
      changed: hasPrevious && !Array.isArray(previousValue), removed: false, depth, children
    };
  }

  if (isJsonObject(value)) {
    const previousObject = isJsonObject(previousValue) ? previousValue : {};
    const children = Object.entries(value).map(([key, child]) => projectJsonValueTree(
      key,
      childPath(path, key),
      child,
      previousObject[key],
      hasPrevious && isJsonObject(previousValue) && Object.prototype.hasOwnProperty.call(previousObject, key),
      depth + 1
    ));

    if (hasPrevious && isJsonObject(previousValue)) {
      for (const [key, previousChild] of Object.entries(previousObject)) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          children.push(removedNode(key, childPath(path, key), previousChild, depth + 1));
        }
      }
    }

    return {
      path, label, kind: 'object', summary: `{${Object.keys(value).length} fields}`, displayValue: '',
      changed: hasPrevious && !isJsonObject(previousValue), removed: false, depth, children
    };
  }

  return {
    path, label, kind: 'value', summary: '', displayValue: formatScalar(value),
    changed: hasPrevious && !jsonEqual(value, previousValue), removed: false, depth, children: []
  };
}

function removedNode(label: string, path: string, value: JsonValue, depth: number): JsonValueTreeNode {
  return {
    path, label, kind: 'value', summary: '', displayValue: `${formatScalar(value)} (removed)`,
    changed: true, removed: true, depth, children: []
  };
}

function childPath(parent: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`;
}

function isJsonObject(value: unknown): value is { [key: string]: JsonValue } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function formatScalar(value: JsonValue): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value) ?? String(value);
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

function jsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
