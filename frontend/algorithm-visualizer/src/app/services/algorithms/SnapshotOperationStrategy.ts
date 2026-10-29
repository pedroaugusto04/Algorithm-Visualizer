import { Injectable } from "@angular/core";
import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { GlobalRenderer } from "../renderers/GlobalRenderer";
import { buildMapGraphSnapshot, buildMapSnapshot } from '../renderers/map-snapshot';
import { AlgorithmOperationStrategy } from "./AlgorithmOperationStrategy";

@Injectable({ providedIn: 'root' })
export class SnapshotOperationStrategy implements AlgorithmOperationStrategy {
  constructor(private globalRenderer: GlobalRenderer) {}

  execute(structure: StructureWindow, structures: StructureWindow[], entry: ExecutionLogEntry, skipRender: boolean): void {
    if (!structure.d3Data) return;

    if (structure.type === 'array') {
      structure.d3Data.arrayData = Array.isArray(entry.value)
        ? JSON.parse(JSON.stringify(entry.value))
        : [entry.value];
    } else if (structure.type === 'map') {
      const data = structure.d3Data;
      const width = data.width || 800;
      const height = data.height || 600;
      const snapshot = structure.viewMode === 'graph'
        ? buildMapGraphSnapshot(entry.path, entry.value, width, height)
        : buildMapSnapshot(entry.path, entry.value, width, height);
      data.nodes = snapshot.nodes;
      data.links = snapshot.links;
      data.mapEntries = snapshot.entries;
    } else {
      return;
    }

    if (!skipRender) this.globalRenderer.renderElements(structures);
  }
}
