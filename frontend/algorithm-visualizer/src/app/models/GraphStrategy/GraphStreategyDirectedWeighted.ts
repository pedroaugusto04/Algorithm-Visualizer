import { GraphStrategy } from "./GraphStrategy";
import * as d3 from 'd3';

export class GraphStrategyDirectedWeighted implements GraphStrategy {
    renderizeGraph(svg: any, items: any[], graphContainer: any): void {
        d3.select(graphContainer.nativeElement).select('svg').remove();
    }
}