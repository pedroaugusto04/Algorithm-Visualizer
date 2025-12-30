import { Injectable } from "@angular/core";
import { Renderer } from "./Renderer";

@Injectable({ providedIn: 'root' })
export class ArrayRenderer implements Renderer {
  renderElements(d3Data: any) {
    if (!d3Data || !d3Data.svg || !d3Data.arrayData) return;

    const { svg, arrayData } = d3Data;
    const cellSize = 50;
    const padding = 10;

    const cells = svg.selectAll('g.array-cell')
      .data(arrayData, (d: any, i: number) => i);

    const allCells = cells.join(
      (enter: any) => {
        const g = enter.append('g').attr('class', 'array-cell');

        g.append('rect')
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('fill', '#fff')
          .attr('stroke', '#333')
          .attr('stroke-width', 2)
          .attr('rx', 4);

        g.append('text')
          .attr('class', 'cell-text')
          .attr('x', cellSize / 2)
          .attr('y', cellSize / 2)
          .attr('dy', '.35em')
          .attr('text-anchor', 'middle')
          .style('font-weight', 'bold');

        g.append('text')
          .attr('class', 'index-text')
          .attr('x', cellSize / 2)
          .attr('y', cellSize + 20)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .attr('fill', '#999');

        return g;
      }
    );

    allCells.transition()
      .duration(300)
      .attr('transform', (d: any, i: number) => `translate(${i * (cellSize + padding) + 40}, 50)`);

    allCells.select('text.cell-text')
      .text((d: any) => (d == undefined ? 0 : d == null ? "" : d.toString()));

    allCells.select('text.index-text')
      .text((d: any, i: number) => `[${i}]`);
  }
}