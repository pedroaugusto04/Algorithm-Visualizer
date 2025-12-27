import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";
import { Injectable } from "@angular/core";
import { GraphRenderer } from "../../renderers/GraphRenderer";
import { GlobalRenderer } from "../../renderers/GlobalRenderer";

@Injectable({ providedIn: 'root' })
export class GraphAccessOperationStrategy implements AlgorithmOperationStrategy {

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

        const d3Data = structure.d3Data;

        const nodeId = this.extractIdFromPath(entry.path);
        
        if (nodeId === null) return;

        const { svg } = d3Data;

        if (skipRender) return;

        this.globalRenderer.renderElements(structures);
        this.pulseNode(svg, nodeId);
    }

    private extractIdFromPath(path: string): number | null {
        const match = path.match(/\[(\d+)\]/);
        return match ? parseInt(match[1]) : null;
    }


    private pulseNode(svg: any, id: number) {
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