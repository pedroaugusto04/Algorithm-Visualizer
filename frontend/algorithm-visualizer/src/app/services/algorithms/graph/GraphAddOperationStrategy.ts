import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";
import { Injectable } from "@angular/core";
import { GraphRenderer } from "../../renderers/GraphRenderer";

@Injectable({ providedIn: 'root' })
export class GraphAddOperationStrategy implements AlgorithmOperationStrategy {

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

    const { nodes, links, svg } = structure.d3Data
    ;
    const sourceId = this.extractSourceId(entry.path);
    const targetId = entry.value;

    if (sourceId === null) return;

    const { width, height } = this.getDimensions(svg);

    this.ensureNodeExists(nodes, sourceId, width, height);
    this.ensureNodeExists(nodes, targetId, width, height);

    const sourceNode = nodes.find((n: any) => n.id === sourceId);
    const targetNode = nodes.find((n: any) => n.id === targetId);

    const linkExists = links.some((l: any) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return s === sourceId && t === targetId;
    });

    if (!linkExists && sourceId !== targetId) {
      links.push({ source: sourceNode, target: targetNode });
    }

    if (skipRender) return;

    this.globalRenderer.renderElements(structure.d3Data);
    this.pulseNode(svg, sourceId);
  }

  private getDimensions(svg: any): { width: number, height: number } {
    const svgNode = svg.node() as SVGSVGElement;
    const viewBox = svgNode.viewBox.baseVal;
    let width = viewBox.width;
    let height = viewBox.height;

    if (width === 0 || height === 0) {
      width = svgNode.clientWidth || 800;
      height = svgNode.clientHeight || 600;
    }
    return { width, height };
  }

  private extractSourceId(path: string): number | null {
    const match = path.match(/\[(\d+)\]/);
    return match ? parseInt(match[1]) : null;
  }

  private ensureNodeExists(nodes: any[], id: number, width: number, height: number) {
    if (!nodes.some(n => n.id === id)) {
      nodes.push({ id, x: width / 2, y: height / 2 });
    }
  }

  private pulseNode(svg: any, id: number) {
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