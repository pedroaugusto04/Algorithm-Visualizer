import { Observable } from "rxjs";
import { GraphItem } from "../GraphItem";
import { GRAPH_UNWEIGHTED_ITEMS } from "../Utils/GraphItemUtils";
import { GraphStrategy } from "./GraphStrategy";
import * as d3 from 'd3';
import { GraphService } from "src/app/services/graph.service";
import { GraphStructure } from "../GraphStructure";
import { GraphIdDTO } from "../DTO/User/GraphIdDTO";
import { CreateGraphStructureComponent } from "src/app/pages/create-graph-structure/create-graph-structure.component";

export class GraphStrategyDirectedUnweighted implements GraphStrategy {

  constructor(private graphService: GraphService, private graphItems: GraphItem[] | null) { }

  createGraph(graph: GraphStructure): Observable<GraphIdDTO> {
    return this.graphService.createDirectedUnweightedGraph(graph);
  }

  updateGraph(graph: GraphStructure): Observable<GraphIdDTO> {
    return this.graphService.updateDirectedUnweightedGraph(graph);
  }

  onPaste(event: ClipboardEvent, index: number, inputs: any, items: GraphItem[], svg: any, graphContainer: any): void {
    setTimeout(() => {
      const input = inputs.toArray()[index]?.nativeElement as HTMLInputElement;
      const value = input.value.trim();

      const parts = value.split(/\s+/);

      if (parts.length > 1) {
        const newItems = [];

        for (let i = 0; i < parts.length; i += 2) {
          const pair = [parts[i], parts[i + 1]].filter(Boolean).join(' ');
          if (pair) {
            newItems.push({ id: CreateGraphStructureComponent.incrementAndGetItemId(), text: pair  });
          }
        }

        items.splice(index, 1, ...newItems);

        setTimeout(() => this.focusLastInput(inputs), 0);
      }
      this.renderizeGraph(svg, items, graphContainer);
    }, 0);
  }

  private focusLastInput(inputs: any) {
    const inputsArray = inputs.toArray();
    if (inputsArray.length > 0) {
      inputsArray[inputsArray.length - 1].nativeElement.focus();
    }
  }

  getInitialItems(): GraphItem[] {
    return this.graphItems != null ? this.graphItems : GRAPH_UNWEIGHTED_ITEMS.map(item => ({ ...item }));
  }

  getPlaceholder(): string {
    return "v1 v2"
  }

  validateGraphInput(graphItems: GraphItem[]): boolean {
    for (const item of graphItems) {
      const subItem: string[] = item.text.split(" ");

      // campos vazios sao desconsiderados
      if (subItem.length == 0) continue;

      if (subItem.length !== 2 ||
        !this.isDigit(subItem[0]) ||
        !this.isDigit(subItem[1])) {
        return false;
      }
    }
    return true;
  }

  isDigit(input: string) {
    return input >= '0' && input <= '9';
  }

  renderizeGraph(svg: any, items: any[], graphContainer: any): void {

    d3.select(graphContainer.nativeElement).select('svg').remove();

    const nodesSet = new Set<number>();
    const links: { source: number, target: number }[] = [];

    for (const item of items) {
      const parts = item.text.trim().split(/\s+/);
      if (parts.length === 2) {
        const source = Number(parts[0]);
        const target = Number(parts[1]);
        if (!isNaN(source) && !isNaN(target)) {
          links.push({ source, target });
          nodesSet.add(source);
          nodesSet.add(target);
        }
      }
    }

    const nodes: any[] = Array.from(nodesSet).map((d: any) => ({ id: d }));

    const containerRect = graphContainer.nativeElement.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;


    svg = d3.select(graphContainer.nativeElement)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width', width)
      .attr('height', height)

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .attr('fill', '#000')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5');

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 20)
      .attr('fill', 'steelblue')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event: any, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d: any) => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '14px')
      .attr('fill', '#fff');

    simulation.on('tick', () => {
      node
        .attr('cx', (d: any) => d.x = Math.max(20, Math.min(width - 20, d.x)))
        .attr('cy', (d: any) => d.y = Math.max(20, Math.min(height - 20, d.y)));

      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });
  }
}