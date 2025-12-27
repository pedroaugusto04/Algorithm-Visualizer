import { Injectable } from "@angular/core";
import { Renderer } from "./Renderer";

@Injectable({ providedIn: 'root' })
export class ArrayRenderer implements Renderer {

    renderElements(
        d3Data: any
    ) {

        if (!d3Data || !d3Data.svg || !d3Data.simulation) {
            return;
        }

        const { svg, arrayData } = d3Data;
        const cellSize = 50;
        const padding = 5;

        svg.selectAll('g.array-cell')
            .data(arrayData)
            .join(
                (enter: any) => {
                    const g = enter.append('g').attr('class', 'array-cell');
                    g.append('rect')
                        .attr('width', cellSize)
                        .attr('height', cellSize)
                        .attr('fill', '#fff')
                        .attr('stroke', '#333')
                        .attr('stroke-width', 2);
                    g.append('text')
                        .attr('class', 'cell-text')
                        .attr('x', cellSize / 2)
                        .attr('y', cellSize / 2)
                        .attr('dy', '.35em')
                        .attr('text-anchor', 'middle')
                        .style('font-family', 'sans-serif');
                    g.append('text')
                        .attr('class', 'index-text')
                        .attr('x', cellSize / 2)
                        .attr('y', cellSize + 15)
                        .attr('text-anchor', 'middle')
                        .style('font-size', '10px')
                        .attr('fill', '#666');
                    return g;
                }
            )
            .attr('transform', (d: any, i: number) => `translate(${i * (cellSize + padding) + 20}, 20)`)
            .select('text.cell-text').text((d: any) => d);

        svg.selectAll('g.array-cell').select('text.index-text').text((d: any, i: number) => i);

        d3Data.simulation.alpha(1).restart();
    }
}