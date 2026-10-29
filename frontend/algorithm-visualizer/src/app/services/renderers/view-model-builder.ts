import { JsonValue } from '../../models/ExecutionLogEntry';
import { StructureWindow } from '../../models/StructureWindow';
import { buildMapGraphSnapshot, buildMapSnapshot } from './map-snapshot';

export function applySnapshotToStructure(
  structure: StructureWindow,
  value: JsonValue,
  viewMode?: string
): void {
  if (!structure.d3Data) return;
  const mode = viewMode || structure.viewMode;

  if (structure.type === 'array') {
    structure.d3Data.arrayData = Array.isArray(value)
      ? JSON.parse(JSON.stringify(value))
      : (value !== null && value !== undefined ? [value] : []);
  } else if (structure.type === 'map') {
    const width = structure.d3Data.width || 800;
    const height = structure.d3Data.height || 600;
    const snapshot = mode === 'graph'
      ? buildMapGraphSnapshot(structure.path, value, width, height)
      : buildMapSnapshot(structure.path, value, width, height);

    structure.d3Data.nodes = snapshot.nodes;
    structure.d3Data.links = snapshot.links;
    structure.d3Data.mapEntries = snapshot.entries;
  }
}
