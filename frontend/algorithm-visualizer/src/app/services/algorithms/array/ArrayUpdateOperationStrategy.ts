import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";
import { Injectable } from "@angular/core";
import { ArrayRenderer } from "../../renderers/ArrayRenderer";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";

@Injectable({ providedIn: 'root' })
export class ArrayUpdateOperationStrategy implements AlgorithmOperationStrategy {

  constructor(private globalRenderer: GlobalRenderer) { }

  execute(structure: StructureWindow, structures: StructureWindow[],  entry: ExecutionLogEntry, skipRender: boolean): void {
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
    if (index === null) return;

    (structure.d3Data.arrayData ?? [])[index] = entry.value;

    if (skipRender) return;

    this.globalRenderer.renderElements(structures);
    this.pulseNode(structure.d3Data.svg, index);
  }

  private extractIndex(path: string): number | null {
    const match = path.match(/\[(\d+)\]/);
    return match ? parseInt(match[1]) : null;
  }

  private pulseNode(svg: any, index: number) {
    svg.selectAll('g.array-cell')
      .filter((d: any, i: number) => i === index)
      .select('rect')
      .transition().duration(200)
      .attr('fill', '#4CAF50')
      .transition().duration(200)
      .attr('fill', '#fff');
  }
}