import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";
import { Injectable } from "@angular/core";
import { GraphRenderer } from "../../renderers/GraphRenderer";

@Injectable({ providedIn: 'root' })
export class GraphRemoveOperationStrategy implements AlgorithmOperationStrategy {

  constructor(private globalRenderer: GraphRenderer) { }

  execute(structure: StructureWindow, entry: ExecutionLogEntry, skipRender: boolean): void {

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

    const parts = entry.path.split(/[\[\]]+/).filter(p => p !== "");

    if (parts.length === 2) {
      const nodeIdToRemove = parseInt(parts[1]);
      this.removeNodeAndLinks(nodeIdToRemove, structure.d3Data);
    }
    else if (parts.length === 3) {
      const sourceId = parseInt(parts[1]);
      const targetValue = entry.value;
      this.removeSpecificLink(sourceId, targetValue, structure.d3Data);
    }

    if (skipRender) return;

    this.globalRenderer.renderElements(structure.d3Data);
  }

  private removeNodeAndLinks(id: number, d3Data: any) {
    d3Data.nodes = d3Data.nodes.filter((n: any) => n.id !== id);
    d3Data.links = d3Data.links.filter((l: any) =>
      l.source.id !== id && l.target.id !== id
    );
  }

  private removeSpecificLink(sourceId: number, targetValue: number, d3Data: any) {
    d3Data.links = d3Data.links.filter((l: any) =>
      !(l.source.id === sourceId && l.target.id === targetValue)
    );
  }
}