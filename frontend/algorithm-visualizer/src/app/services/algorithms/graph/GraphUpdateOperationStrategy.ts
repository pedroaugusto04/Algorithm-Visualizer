import { Injectable } from "@angular/core";
import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";

@Injectable({ providedIn: 'root' })
export class GraphUpdateOperationStrategy implements AlgorithmOperationStrategy {

  constructor(private globalRenderer: GlobalRenderer) { }

  execute(
    structure: StructureWindow,
    structures: StructureWindow[],
    entry: ExecutionLogEntry,
    skipRender: boolean
  ): void {
    if (!structure.d3Data) return;

    const { svg, nodes } = structure.d3Data;
    const targetIdPrefix = entry.path;

    const nodeToUpdate = nodes
      .filter((n: any) => n.pathId.startsWith(targetIdPrefix))
      .pop();

    nodes.forEach(node => console.log(node.pathId));

    if (!nodeToUpdate) return;

    nodeToUpdate.value = entry.value;

    if (skipRender) return;

    this.globalRenderer.renderElements(structures);
    this.pulseNode(svg, nodeToUpdate.pathId);
  }

  private pulseNode(svg: any, pathId: string) {
    if (!svg) return;

    svg.selectAll('g.node-item')
      .filter((d: any) => d.pathId === pathId)
      .select('circle')
      .transition().duration(300)
      .attr('fill', '#4CAF50')
      .attr('r', 25)
      .transition().duration(300)
      .attr('fill', 'steelblue')
      .attr('r', 20);
  }
}