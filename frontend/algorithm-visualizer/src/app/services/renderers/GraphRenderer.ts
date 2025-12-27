import { Injectable } from "@angular/core";
import { Renderer } from "./Renderer";
import * as d3 from "d3";

@Injectable({ providedIn: 'root' })
export class GraphRenderer implements Renderer {

    renderElements(
        d3Data: any
    ) {

        if (!d3Data || !d3Data.svg || !d3Data.simulation) {
            return;
        }

        const { width, height } = this.getDimensions(d3Data.svg);
        const radius = 20;

        let linkGroup = d3Data.svg.select('g.links-group');
        if (linkGroup.empty()) {
            linkGroup = d3Data.svg.insert('g', ':first-child').attr('class', 'links-group');
        }

        let nodeGroup = d3Data.svg.select('g.nodes-group');
        if (nodeGroup.empty()) {
            nodeGroup = d3Data.svg.append('g').attr('class', 'nodes-group');
        }

        const linkSelection = linkGroup
            .selectAll('line')
            .data(d3Data.links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        const nodeSelection = nodeGroup
            .selectAll('g.node-item')
            .data(d3Data.nodes, (d: any) => d.id)
            .join((enter: any) => {
                const g = enter.append('g')
                    .attr('class', 'node-item')
                    .style('cursor', 'pointer')
                    .call(this.drag(d3Data.simulation));

                g.append('circle')
                    .attr('r', radius)
                    .attr('fill', enter.color || 'steelblue')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5);

                g.append('text')
                    .attr('class', 'node-text')
                    .text((d: any) => d.id)
                    .attr('text-anchor', 'middle')
                    .attr('dy', '.35em')
                    .attr('fill', '#fff')
                    .style('font-family', 'sans-serif')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('user-select', 'none');

                return g;
            });

        d3Data.simulation.nodes(d3Data.nodes);
        d3Data.simulation.force('link').links(d3Data.links);
        d3Data.simulation.force('center', d3.forceCenter(width / 2, height / 2));
        d3Data.simulation.force('collide', d3.forceCollide(radius + 5));

        d3Data.simulation.on('tick', () => {
            nodeSelection.attr('transform', (d: any) => {
                const x = d.x || width / 2;
                const y = d.y || height / 2;
                d.x = Math.max(radius, Math.min(width - radius, x));
                d.y = Math.max(radius, Math.min(height - radius, y));
                return `translate(${d.x},${d.y})`;
            });

            linkSelection
                .attr('x1', (d: any) => d.source?.x ?? 0)
                .attr('y1', (d: any) => d.source?.y ?? 0)
                .attr('x2', (d: any) => d.target?.x ?? 0)
                .attr('y2', (d: any) => d.target?.y ?? 0);
        });

        d3Data.simulation.alpha(1).restart();
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

    private drag(simulation: any) {
        return d3.drag()
            .on('start', (event, d: any) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d: any) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d: any) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }
}