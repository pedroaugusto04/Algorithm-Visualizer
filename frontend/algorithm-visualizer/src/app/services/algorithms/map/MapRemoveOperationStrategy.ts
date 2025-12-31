import { Injectable } from "@angular/core";
import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";

@Injectable({ providedIn: 'root' })
export class MapRemoveOperationStrategy implements AlgorithmOperationStrategy {
  constructor(private globalRenderer: GlobalRenderer) { }

  execute(structure: StructureWindow, structures: StructureWindow[], entry: ExecutionLogEntry, skipRender: boolean): void {
    if (!structure.d3Data) return;

    const pathToRemove = entry.path;
    const d3Data = structure.d3Data;

    d3Data.nodes = d3Data.nodes.filter((n: any) => !n.id.startsWith(pathToRemove));

    d3Data.links = d3Data.links.filter((l: any) => {
      const sId = typeof l.source === 'string' ? l.source : l.source.id;
      const tId = typeof l.target === 'string' ? l.target : l.target.id;
      return !sId.startsWith(pathToRemove) && !tId.startsWith(pathToRemove);
    });

    if (skipRender) return;
    this.globalRenderer.renderElements(structures);
  }
}