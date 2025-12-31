import { Injectable } from "@angular/core";
import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";

@Injectable({ providedIn: 'root' })
export class GraphRemoveOperationStrategy implements AlgorithmOperationStrategy {
  constructor(private globalRenderer: GlobalRenderer) { }

  execute(structure: StructureWindow, structures: StructureWindow[], entry: ExecutionLogEntry, skipRender: boolean): void {
    if (!structure.d3Data) return;

    const pathToRemove = entry.path;
    const d3Data = structure.d3Data;

    d3Data.links = d3Data.links.filter((l: any) => {
      const tId = l.target.pathId;
      return !tId.startsWith(pathToRemove);
    });

    if (skipRender) return;
    this.globalRenderer.renderElements(structures);
  }
}