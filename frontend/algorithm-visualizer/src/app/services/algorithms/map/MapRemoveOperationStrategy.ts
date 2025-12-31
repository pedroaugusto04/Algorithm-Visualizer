import { Injectable } from "@angular/core";
import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";

@Injectable({ providedIn: 'root' })
export class MapRemoveOperationStrategy implements AlgorithmOperationStrategy {

  constructor(private globalRenderer: GlobalRenderer) { }

  execute(
    structure: StructureWindow,
    structures: StructureWindow[],
    entry: ExecutionLogEntry,
    skipRender: boolean
  ): void {

    if (!structure.d3Data) return;

    const matches = [...entry.path.matchAll(/\[(\d+)\]/g)].map(m => m[1]);

    if (matches.length === 1) {
      const nodeId = `k${matches[0]}`;
      this.removeNodeAndLinks(nodeId, structure.d3Data);
    }

    if (matches.length === 2) {
      const sourceId = `k${matches[0]}`;
      const targetId = `v${matches[1]}`;
      this.removeSpecificLink(sourceId, targetId, structure.d3Data);
    }

    if (skipRender) return;

    this.globalRenderer.renderElements(structures);
  }

  private removeNodeAndLinks(id: string, d3Data: any) {
    d3Data.nodes = d3Data.nodes.filter((n: any) => n.id !== id);
    d3Data.links = d3Data.links.filter((l: any) =>
      l.source.id !== id && l.target.id !== id
    );
  }

  private removeSpecificLink(sourceId: string, targetId: string, d3Data: any) {
    d3Data.links = d3Data.links.filter((l: any) =>
      !(l.source.id === sourceId && l.target.id === targetId)
    );
  }
}
