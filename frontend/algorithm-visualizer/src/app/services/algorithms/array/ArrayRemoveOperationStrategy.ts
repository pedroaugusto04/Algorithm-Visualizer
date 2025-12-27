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

    const index = this.extractIndex(entry.path);
    if (index !== null && index < (structure.d3Data.arrayData ?? []).length) {
      (structure.d3Data.arrayData ?? []).splice(index, 1);

      if (skipRender) return;

      this.globalRenderer.renderElements(structures);
    }
  }

  private extractIndex(path: string): number | null {
    const match = path.match(/\[(\d+)\]/);
    return match ? parseInt(match[1]) : null;
  }
}