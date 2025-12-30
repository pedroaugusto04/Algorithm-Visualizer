import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";
import { Injectable } from "@angular/core";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";

@Injectable({ providedIn: 'root' })
export class ArrayAddOperationStrategy implements AlgorithmOperationStrategy {

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

    if (!structure.d3Data.arrayData) structure.d3Data.arrayData = [];

    const index = this.extractIndex(entry.path);

    if (index !== null) {
      structure.d3Data.arrayData[index] = entry.value;
    } else {
      structure.d3Data.arrayData.push(entry.value);
    }

    if (skipRender) return;

    this.globalRenderer.renderElements(structures);
  }


  private extractIndex(path: string): number | null {
    const match = path.match(/\[(\d+)\]/);
    return match ? parseInt(match[1]) : null;
  }

}