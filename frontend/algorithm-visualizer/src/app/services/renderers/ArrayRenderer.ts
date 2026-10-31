import { Injectable } from "@angular/core";
import { Renderer } from "./Renderer";
import { isStructuredValue, refreshStructuredSelection, toggleStructuredSelection } from './structured-value-selection';

export function formatArrayCellValue(value: unknown): string {
  if (value === undefined) return "0";
  if (value === null) return "";
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value) ?? String(value);
  return String(value);
}

@Injectable({ providedIn: 'root' })
export class ArrayRenderer implements Renderer {
  renderElements(d3Data: any) {
    if (!d3Data || !d3Data.svg || !d3Data.arrayData) return;

    if (d3Data.simulation) {
      d3Data.simulation.stop();
      d3Data.simulation = null;
    }
    d3Data.svg.selectAll('g.links-group, g.nodes-group, g.map-header, g.map-entry').remove();

    const { svg, arrayData } = d3Data;
    const cellHeight = 50;
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
            valuePath: `${d3Data.ownerPath ?? 'value'}[${r}][${c}]`,
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
        valuePath: `${d3Data.ownerPath ?? 'value'}[${i}]`,
        label: `[${i}]`
      }));
    }

    refreshStructuredSelection(d3Data, flatData.map((cell: any) => ({ path: cell.valuePath, value: cell.value })));

    const displayValues = flatData.map((d: any) => formatArrayCellValue(d.value));
    const hasStructuredValues = flatData.some((d: any) => d.value !== null && typeof d.value === 'object');
    const longestValue = displayValues.reduce((longest, value) => Math.max(longest, value.length), 0);
    const cellWidth = hasStructuredValues ? Math.min(240, Math.max(50, longestValue * 7 + 16)) : 50;

    const cells = svg.selectAll('g.array-cell')
      .data(flatData, (d: any) => d.key);

    const allCells = cells.join(
      (enter: any) => {
        const g = enter.append('g').attr('class', 'array-cell');

        g.append('rect')
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', '#fff')
          .attr('stroke', '#333')
          .attr('stroke-width', 2)
          .attr('rx', 4);

        g.append('text')
          .attr('class', 'cell-text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight / 2)
          .attr('dy', '.35em')
          .attr('text-anchor', 'middle')
          .style('font-weight', 'bold');

        g.append('title');

        g.append('text')
          .attr('class', 'index-text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight + 20)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .attr('fill', '#999');

        return g;
      }
    );

    const changed = d3Data.changedPaths as Set<string> | undefined;
    const isChanged = (p: string) => changed?.has(p) ?? false;

    allCells.select('rect')
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('fill', (d: any) => isChanged(d.valuePath) ? '#fef08a' : '#fff')
      .attr('stroke', (d: any) => {
        if (d.valuePath === d3Data.selectedValuePath) return '#ff9800';
        if (isChanged(d.valuePath)) return '#eab308';
        return '#333';
      })
      .attr('stroke-width', (d: any) => (d.valuePath === d3Data.selectedValuePath || isChanged(d.valuePath)) ? 3 : 2);
    allCells.select('text.cell-text').attr('x', cellWidth / 2);
    allCells.select('text.index-text').attr('x', cellWidth / 2);
    allCells.style('cursor', (d: any) => isStructuredValue(d.value) ? 'pointer' : 'default')
      .on('click.structured-value', (_event: unknown, d: any) => {
        if (!isStructuredValue(d.value)) return;
        toggleStructuredSelection(d3Data, { path: d.valuePath, value: d.value });
        allCells.select('rect')
          .attr('stroke', (cell: any) => cell.valuePath === d3Data.selectedValuePath ? '#ff9800' : '#333')
          .attr('stroke-width', (cell: any) => cell.valuePath === d3Data.selectedValuePath ? 3 : 2);
      });

    const isStack = d3Data.viewMode === 'stack' && !is2D;
    const isQueue = d3Data.viewMode === 'queue' && !is2D;
    const columnCount = is2D
      ? Math.max(0, ...arrayData.map((row: any[]) => row?.length ?? 0))
      : flatData.length;
    const rowCount = is2D ? arrayData.length : (isStack ? flatData.length : 1);
    const viewWidth = isStack
      ? Math.max(240, cellWidth + 160)
      : Math.max(160, columnCount * (cellWidth + padding) + 80);
    const viewHeight = Math.max(160, rowCount * (cellHeight + padding) + 100);
    svg.attr('viewBox', `0 0 ${viewWidth} ${viewHeight}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    allCells.transition()
      .duration(300)
      .attr('transform', (d: any) => {
        const x = isStack ? 80 : d.c * (cellWidth + padding) + 40;
        const y = isStack
          ? 50 + d.c * (cellHeight + padding)
          : d.r * (cellHeight + padding) + 50;
        return `translate(${x}, ${y})`;
      });

    allCells.select('text.cell-text')
      .text((d: any) => formatArrayCellValue(d.value))
      .style('font-size', hasStructuredValues ? '10px' : null);

    allCells.select('title')
      .text((d: any) => formatArrayCellValue(d.value));

    allCells.select('text.index-text')
      .text((d: any) => d.label)
      .style('font-size', is2D ? '9px' : '12px')
      .attr('y', is2D ? cellHeight + 13 : cellHeight + 20);

    if (isQueue || isStack) {
      const markers = flatData.length === 0 ? [] : [
        { label: isStack ? 'TOP' : 'FRONT', index: 0 },
        { label: isStack ? 'BOTTOM' : 'REAR', index: flatData.length - 1 }
      ];
      const markerSelection = svg.selectAll('text.array-end-marker').data(markers, (marker: any) => marker.label);
      markerSelection.exit().remove();
      markerSelection.join('text').attr('class', 'array-end-marker')
        .attr('x', (marker: any) => isStack ? 80 + cellWidth + 16 : marker.index * (cellWidth + padding) + 40 + cellWidth / 2)
        .attr('y', (marker: any) => isStack
          ? 50 + marker.index * (cellHeight + padding) + cellHeight / 2 + 4
          : 50 + cellHeight + 42)
        .attr('text-anchor', isStack ? 'start' : 'middle')
        .attr('fill', '#64748b').style('font-size', '10px').style('font-weight', 700)
        .text((marker: any) => marker.label);
    } else {
      svg.selectAll('text.array-end-marker').remove();
    }
  }

}
