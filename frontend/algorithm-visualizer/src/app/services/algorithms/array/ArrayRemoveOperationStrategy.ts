import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";
import { Injectable } from "@angular/core";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";

@Injectable({ providedIn: 'root' })
export class ArrayRemoveOperationStrategy implements AlgorithmOperationStrategy {

  constructor(private globalRenderer: GlobalRenderer) { }

  execute(structure: StructureWindow, structures: StructureWindow[], entry: ExecutionLogEntry, skipRender: boolean): void {
    if (!structure.d3Data) {
      structure.d3Data = {
        nodes: [] as any[],
        links: [] as any[],
        simulation: null,
        svg: null,
        width: 800,
        height: 600
      };
    }

    const indices = this.extractIndices(entry.path);
    if (indices.length > 0) {
      if (!structure.d3Data.arrayData) structure.d3Data.arrayData = [];
      let curr = structure.d3Data.arrayData;
      for (let i = 0; i < indices.length - 1; i++) {
        const idx = indices[i];
        if (!curr[idx]) {
          curr[idx] = [];
        }
        curr = curr[idx];
      }
      const lastIdx = indices[indices.length - 1];
      if (curr && lastIdx < curr.length) {
        curr.splice(lastIdx, 1);
      }
    }

    if (skipRender) return;

    this.globalRenderer.renderElements(structures);
  }

  private extractIndices(path: string): number[] {
    const regex = /\[(\d+)\]/g;
    const indices: number[] = [];
    let match;
    while ((match = regex.exec(path)) !== null) {
      indices.push(parseInt(match[1]));
    }
    return indices;
  }
}