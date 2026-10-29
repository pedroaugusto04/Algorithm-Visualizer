import { Injectable } from "@angular/core";
import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { GlobalRenderer } from "../renderers/GlobalRenderer";
import { applySnapshotToStructure } from "../renderers/view-model-builder";
import { AlgorithmOperationStrategy } from "./AlgorithmOperationStrategy";

@Injectable({ providedIn: 'root' })
export class SnapshotOperationStrategy implements AlgorithmOperationStrategy {
  constructor(private globalRenderer: GlobalRenderer) {}

  execute(structure: StructureWindow, structures: StructureWindow[], entry: ExecutionLogEntry, skipRender: boolean): void {
    if (!structure.d3Data) return;
    applySnapshotToStructure(structure, entry.value, structure.viewMode);
    if (!skipRender) this.globalRenderer.renderElements(structures);
  }
}
