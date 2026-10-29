import type { JsonValue } from '../../models/ExecutionLogEntry';
import { isStructuredValue } from './structured-value-selection';

export interface MapVisualNode {
  id: string;
  value: string;
  color: string;
  x: number;
  y: number;
  structuredValuePath?: string;
  structuredValue?: JsonValue;
}

export interface MapVisualLink {
  source: MapVisualNode;
  target: MapVisualNode;
}

export interface MapSnapshot {
  nodes: MapVisualNode[];
  links: MapVisualLink[];
}

export function buildMapSnapshot(path: string, value: JsonValue, width: number, height: number): MapSnapshot {
  const root: MapVisualNode = {
    id: path,
    value: path,
    color: 'orange',
    x: width / 2,
    y: height / 2
  };
  const nodes = [root];
  const links: MapVisualLink[] = [];
  const entries = Array.isArray(value)
    ? value as JsonValue[][]
    : isStructuredValue(value)
      ? Object.entries(value)
      : [];

  entries.forEach((entry: any, index: number) => {
    if (!Array.isArray(entry) || entry.length < 2) return;
    const [key, entryValue] = entry;
    const targetId = `${path}[${key}]`;
    const id = Array.isArray(value) ? `${targetId}#${index}` : targetId;
    const node: MapVisualNode = {
      id,
      value: `${key}: ${typeof entryValue === 'string' ? entryValue : JSON.stringify(entryValue)}`,
      color: 'steelblue',
      x: width / 2,
      y: height / 2
    };
    if (isStructuredValue(entryValue)) {
      node.structuredValuePath = id;
      node.structuredValue = entryValue;
    }
    nodes.push(node);
    links.push({ source: root, target: node });
  });

  return { nodes, links };
}
