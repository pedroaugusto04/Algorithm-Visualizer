import { Injectable } from "@angular/core";
import { Renderer } from "./Renderer";

@Injectable({ providedIn: 'root' })
export class ArrayRenderer implements Renderer {
  renderElements(d3Data: any) {
    if (!d3Data || !d3Data.svg || !d3Data.arrayData) return;

    const { svg, arrayData } = d3Data;
    const cellSize = 50;
    const padding = 10;

    const is2D = arrayData.length > 0 && Array.isArray(arrayData[0]);

    let flatData: any[] = [];
    if (is2D) {
      for (let r = 0; r < arrayData.length; r++) {
        const row = arrayData[r] || [];
        for (let c = 0; c < row.length; c++) {
          flatData.push({
            value: row[c],
            r: r,
            c: c,
            key: `${r}-${c}`,
            label: `[${r}][${c}]`
          });
        }
      }
    } else {
      flatData = arrayData.map((d: any, i: number) => ({
        value: d,
        r: 0,
        c: i,
        key: `${i}`,
        label: `[${i}]`
      }));
    }

    const cells = svg.selectAll('g.array-cell')
      .data(flatData, (d: any) => d.key);

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
      .attr('transform', (d: any) => `translate(${d.c * (cellSize + padding) + 40}, ${d.r * (cellSize + padding) + 50})`);

    allCells.select('text.cell-text')
      .text((d: any) => (d.value == undefined ? 0 : d.value == null ? "" : d.value.toString()));

    allCells.select('text.index-text')
      .text((d: any) => d.label)
      .style('font-size', is2D ? '9px' : '12px')
      .attr('y', is2D ? cellSize + 13 : cellSize + 20);
  }
}