import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";
import { Injectable } from "@angular/core";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";

@Injectable({ providedIn: 'root' })
export class ArrayAccessOperationStrategy implements AlgorithmOperationStrategy {

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
    if (indices.length === 0) return;

    if (skipRender) return;

    this.globalRenderer.renderElements(structures);
    this.pulseNode(structure.d3Data.svg, indices);
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

  private pulseNode(svg: any, indices: number[]) {
    const key = indices.join('-');
    svg.selectAll('g.array-cell')
      .filter((d: any) => d.key === key)
      .select('rect')
      .transition().duration(200)
      .attr('fill', '#4CAF50')
      .transition().duration(200)
      .attr('fill', '#fff');
  }
}