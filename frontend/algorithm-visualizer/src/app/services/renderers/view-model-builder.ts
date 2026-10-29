import { JsonValue } from '../../models/ExecutionLogEntry';
import { StructureWindow, StructureViewMode } from '../../models/StructureWindow';
import { buildMapGraphSnapshot, buildMapSnapshot } from './map-snapshot';

type SnapshotStrategy = (structure: StructureWindow, value: JsonValue) => void;

function applyArraySnapshot(structure: StructureWindow, value: JsonValue): void {
  if (!structure.d3Data) return;
  structure.d3Data.arrayData = Array.isArray(value)
    ? JSON.parse(JSON.stringify(value))
    : (value !== null && value !== undefined ? [value] : []);
}

function applyArrayGraphSnapshot(structure: StructureWindow, value: JsonValue): void {
  if (!structure.d3Data) return;
  const width = structure.d3Data.width || 800;
  const height = structure.d3Data.height || 600;
  const snapshot = buildMapGraphSnapshot(structure.path, value, width, height, true);
  structure.d3Data.nodes = snapshot.nodes;
  structure.d3Data.links = snapshot.links;
  structure.d3Data.mapEntries = snapshot.entries;
}

function applyMapSnapshot(structure: StructureWindow, value: JsonValue): void {
  if (!structure.d3Data) return;
  const width = structure.d3Data.width || 800;
  const height = structure.d3Data.height || 600;
  const snapshot = buildMapSnapshot(structure.path, value, width, height);
  structure.d3Data.nodes = snapshot.nodes;
  structure.d3Data.links = snapshot.links;
  structure.d3Data.mapEntries = snapshot.entries;
}

function applyMapGraphSnapshot(structure: StructureWindow, value: JsonValue): void {
  if (!structure.d3Data) return;
  const width = structure.d3Data.width || 800;
  const height = structure.d3Data.height || 600;
  const snapshot = buildMapGraphSnapshot(structure.path, value, width, height, false);
  structure.d3Data.nodes = snapshot.nodes;
  structure.d3Data.links = snapshot.links;
  structure.d3Data.mapEntries = snapshot.entries;
}

const STRATEGIES: Record<string, SnapshotStrategy> = {
  'array:graph': applyArrayGraphSnapshot,
  'array': applyArraySnapshot,
  'map:graph': applyMapGraphSnapshot,
  'map': applyMapSnapshot,
};

export function applySnapshotToStructure(
  structure: StructureWindow,
  value: JsonValue,
  viewMode?: StructureViewMode | string
): void {
  if (!structure.d3Data) return;
  const mode = (viewMode || structure.viewMode || structure.type) as string;

  const strategy = STRATEGIES[`${structure.type}:${mode}`]
    || STRATEGIES[mode]
    || STRATEGIES[structure.type];

  if (strategy) {
    strategy(structure, value);
  }
}
