import { Injectable } from "@angular/core";
import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";

@Injectable({ providedIn: 'root' })
export class GraphAddOperationStrategy implements AlgorithmOperationStrategy {
  constructor(private globalRenderer: GlobalRenderer) { }

  execute(structure: StructureWindow, structures: StructureWindow[], entry: ExecutionLogEntry, skipRender: boolean): void {
    if (!structure.d3Data) {
      structure.d3Data = { nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 };
    }

    const { nodes, links, svg, width, height } = structure.d3Data;

    const sourceValue = this.extractPenultimateValue(entry.path);

    if (sourceValue === null) return;

    const sourceId = String(sourceValue);
    const targetId = String(entry.value);

    const sourcePathId = this.extractSourcePathId(entry.path);
    const targetPathId = entry.path;

    if (sourcePathId == null) return;

    this.ensureNode(nodes, sourceId, sourcePathId, sourceValue, width, height);
    this.ensureNode(nodes, targetId, targetPathId, entry.value, width, height);

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
    this.globalRenderer.renderElements(structures);
    this.pulseNode(svg, sourceId);
  }

  private extractPenultimateValue(path: string): string | null {
    const matches = Array.from(path.matchAll(/\[(\d+)\]/g));
    if (matches.length < 1) return null;
    return matches.length >= 2 ? matches[matches.length - 2][1] : matches[0][1];
  }

  private extractSourcePathId(path: string): string | null {
    const lastBracketIndex = path.lastIndexOf('[');
    if (lastBracketIndex === -1) return null;

    return path.substring(0, lastBracketIndex);
  }

  private ensureNode(nodes: any[], id: string, pathId: string, value: string,  width: number, height: number) {
    if (!nodes.some(n => n.id === id)) {
      nodes.push({ id: id, pathId: pathId, value: value, x: width / 2, y: height / 2 });
    }
  }

  private pulseNode(svg: any, id: string) {
    if (!svg) return;
    svg.selectAll('g.node-item').filter((d: any) => d.pathId === id).select('circle')
      .transition().duration(300).attr('fill', 'yellow').attr('r', 25)
      .transition().duration(300).attr('fill', 'steelblue').attr('r', 20);
  }
}