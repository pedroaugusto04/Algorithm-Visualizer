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
  label?: string;
}

export interface MapSnapshot {
  nodes: MapVisualNode[];
  links: MapVisualLink[];
  entries: Array<{ key: string; value: JsonValue; path: string }>;
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
  const mapEntries: MapSnapshot['entries'] = [];
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
    mapEntries.push({ key: String(key), value: entryValue, path: targetId });
  });

  return { nodes, links, entries: mapEntries };
}

/** Treat map keys or 2D array indices as graph vertices and collection values as outgoing neighbors. */
export function buildMapGraphSnapshot(
  path: string,
  value: JsonValue,
  width: number,
  height: number,
  isArray = false
): MapSnapshot {
  const map = buildMapSnapshot(path, value, width, height);

  let rawEntries: [unknown, unknown][] = [];
  if (isArray && Array.isArray(value)) {
    rawEntries = value.map((neighbors, i) => [i, neighbors]);
  } else if (Array.isArray(value)) {
    rawEntries = value.filter((entry): entry is JsonValue[] => Array.isArray(entry) && entry.length >= 2)
      .map(entry => [entry[0], entry[1]]);
  } else if (isStructuredValue(value)) {
    rawEntries = Object.entries(value);
  }
  const nodeById = new Map<string, MapVisualNode>();
  const links: MapVisualLink[] = [];
  const getNode = (value: unknown): MapVisualNode => {
    const id = String(value);
    let node = nodeById.get(id);
    if (!node) {
      node = { id, value: id, color: '#2563eb', x: width / 2, y: height / 2 };
      nodeById.set(id, node);
    }
    return node;
  };

  rawEntries.forEach((raw: any) => {
    if (!Array.isArray(raw) || raw.length < 2) return;
    const [sourceValue, neighbors] = raw;
    const source = getNode(sourceValue);
    source.structuredValuePath = `${path}[${sourceValue}]`;
    source.structuredValue = neighbors as JsonValue;
    if (Array.isArray(neighbors)) {
      neighbors.forEach(neighbor => {
        if (Array.isArray(neighbor) && neighbor.length >= 2) {
          links.push({ source, target: getNode(neighbor[0]), label: String(neighbor[1]) });
        } else {
          links.push({ source, target: getNode(neighbor) });
        }
      });
    } else if (isStructuredValue(neighbors)) {
      Object.entries(neighbors).forEach(([neighbor, weight]) => links.push({
        source,
        target: getNode(neighbor),
        label: String(weight)
      }));
    }
  });

  if (nodeById.size === 0) {
    return { ...map, nodes: [{ id: path, value: path, color: 'orange', x: width / 2, y: height / 2 }], links: [] };
  }
  return { ...map, nodes: [...nodeById.values()], links };
}
