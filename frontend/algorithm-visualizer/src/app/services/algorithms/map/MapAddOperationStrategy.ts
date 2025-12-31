import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";
import { Injectable } from "@angular/core";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";

@Injectable({ providedIn: 'root' })
export class MapAddOperationStrategy implements AlgorithmOperationStrategy {

  constructor(private globalRenderer: GlobalRenderer) { }

  execute(
    structure: StructureWindow,
    structures: StructureWindow[],
    entry: ExecutionLogEntry,
    skipRender: boolean
  ): void {

    if (!structure.d3Data) {
      structure.d3Data = {
        nodes: [],
        links: [],
        simulation: null,
        svg: null,
        width: 800,
        height: 600
      };
    }

    const { nodes, links, svg, width, height } = structure.d3Data;

    const sourceId = this.extractSourceId(entry.path);
    if (!sourceId) return;

    const sourceValue = this.extractLastIndex(sourceId);

    const targetValue = entry.value;

    const targetId = entry.path;

    this.ensureNode(nodes, sourceId, sourceValue, "orange", width, height);
    this.ensureNode(nodes, targetId, targetValue, "steelblue", width, height);

    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode) return;

    links.push({ source: sourceNode, target: targetNode });

    if (skipRender) return;

    this.globalRenderer.renderElements(structures);
    this.pulseNode(svg, sourceId);
  }


  private extractSourceId(path: string): string | null {
    const lastBracketIndex = path.lastIndexOf('[');
    if (lastBracketIndex === -1) return null;

    return path.substring(0, lastBracketIndex);
  }

  private extractLastIndex(path: string): number {
    const matches = path.match(/\[(\d+)\](?=[^[]*$)/); 
    return matches ? Number(matches[1]) : 0;
  }

  private ensureNode(
    nodes: any[],
    id: string,
    value: number,
    color: string,
    width: number,
    height: number
  ) {
    if (!nodes.some(n => n.id === id)) {
      nodes.push({
        id: id,
        value: value,
        color: color,
        x: width / 2,
        y: height / 2
      });
    }
  }

  private pulseNode(svg: any, id: string) {
    if (!svg) return;
    svg.selectAll('g.node-item')
      .filter((d: any) => d.id === id)
      .select('circle')
      .transition().duration(300)
      .attr('fill', 'orange')
      .attr('r', 25)
      .transition().duration(300)
      .attr('fill', 'steelblue')
      .attr('r', 20);
  }
}
