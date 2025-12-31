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
    const targetIdPrefix = entry.path;
    
    const nodeToUpdate = nodes
      .filter((n: any) => n.id.startsWith(targetIdPrefix))
      .pop();

    if (!nodeToUpdate) return;

    nodeToUpdate.value = entry.value;

    if (skipRender) return;

    this.globalRenderer.renderElements(structures);
    this.pulseNode(svg, nodeToUpdate.id);
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