import { Injectable } from "@angular/core";
import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";

@Injectable({ providedIn: 'root' })
export class MapUpdateOperationStrategy implements AlgorithmOperationStrategy {

  constructor(private globalRenderer: GlobalRenderer) { }

  execute(
    structure: StructureWindow,
    structures: StructureWindow[],
    entry: ExecutionLogEntry,
    skipRender: boolean
  ): void {

    if (!structure.d3Data) return;

    const { svg, nodes } = structure.d3Data;

    const sourceId = this.extractSourceId(entry.path);
    if (!sourceId) return;

    const newValue = entry.value;

    const node = nodes.find((n: any) => n.id === sourceId);
    if (node) {
      node.value = newValue;
    }

    if (skipRender) return;

    this.globalRenderer.renderElements(structures);
    this.pulseNode(svg, sourceId);
  }

  private extractSourceId(path: string): string | null {
    const match = path.match(/\[(\d+)\]/);
    return match ? `k${match[1]}` : null;
  }

  private pulseNode(svg: any, id: string) {
    if (!svg) return;

    svg.selectAll('g.node-item')
      .filter((d: any) => d.id === id)
      .select('circle')
      .transition().duration(300)
      .attr('fill', '#4CAF50')
      .attr('r', 25)
      .transition().duration(300)
      .attr('fill', 'steelblue')
      .attr('r', 20);
  }
}
