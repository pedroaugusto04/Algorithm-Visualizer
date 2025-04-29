import { Observable } from "rxjs";
import { GraphItem } from "../GraphItem";
import { GRAPH_WEIGHTED_ITEMS } from "../Utils/GraphItemUtils";
import { GraphStrategy } from "./GraphStrategy";
import * as d3 from 'd3';

export class GraphStrategyUndirectedWeighted implements GraphStrategy {
    
    createGraph(): Observable<void> {
        throw new Error("Method not implemented.");
    }

    onPaste(event: ClipboardEvent, index: number, inputs: any, items: GraphItem[], svg: any, graphContainer: any): void {
        setTimeout(() => {
            const input = inputs.toArray()[index]?.nativeElement as HTMLInputElement;
            const value = input.value.trim();

            const parts = value.split(/\s+/);

            if (parts.length > 2) {
                const newItems = [];

                for (let i = 0; i < parts.length; i += 3) {
                    const pair = [parts[i], parts[i + 1], parts[i + 2]].filter(Boolean).join(' ');
                    if (pair) {
                        newItems.push({ text: pair });
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
        return GRAPH_WEIGHTED_ITEMS;
    }

    getPlaceholder(): string {
        return "v1 v2 w"
    }

    renderizeGraph(svg: any, items: any[], graphContainer: any): void {

        d3.select(graphContainer.nativeElement).select('svg').remove();

        const nodesSet = new Set<number>();
        const links: { source: number, target: number, weight: number }[] = [];

        for (const item of items) {
            const parts = item.text.trim().split(/\s+/);
            if (parts.length === 3) {
                const source = Number(parts[0]);
                const target = Number(parts[1]);
                const weight = Number(parts[2])
                if (!isNaN(source) && !isNaN(target) && !isNaN(weight)) {
                    links.push({ source, target, weight });
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


        const linkLabel = svg.append('g')
            .selectAll('text')
            .data(links)
            .join('text')
            .attr('class', 'link-label')
            .text(function (d: any) {
                return d.weight;
            })
            .attr('font-size', 12)
            .attr('fill', 'black');


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
                .attr('y2', (d: any) => d.target.y)

            label
                .attr('x', (d: any) => d.x)
                .attr('y', (d: any) => d.y)

            linkLabel
                .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
                .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 15); // desloca um pouco pra cima
        });
    }
}