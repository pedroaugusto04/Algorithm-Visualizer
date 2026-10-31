import { Injectable } from "@angular/core";
import * as d3 from 'd3';
import { Renderer } from "./Renderer";
import { isStructuredValue, refreshStructuredSelection, toggleStructuredSelection } from './structured-value-selection';

export function formatArrayCellValue(value: unknown): string {
  if (value === undefined) return "0";
  if (value === null) return "";
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value) ?? String(value);
  return String(value);
}

function isValueRelevant(value: unknown): boolean {
  if (value === 0 || value === null || value === undefined || value === '' || value === false) {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
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
      let maxRelevantRow = -1;
      let maxRelevantCol = -1;
      if (arrayData.length > 15) {
        for (let r = 0; r < arrayData.length; r++) {
          const row = arrayData[r];
          if (Array.isArray(row)) {
            for (let c = 0; c < row.length; c++) {
              if (isValueRelevant(row[c])) {
                maxRelevantRow = Math.max(maxRelevantRow, r);
                maxRelevantCol = Math.max(maxRelevantCol, c);
              }
            }
          } else if (isValueRelevant(row)) {
            maxRelevantRow = Math.max(maxRelevantRow, r);
          }
        }
      }
      const rowLimit = arrayData.length > 15
        ? Math.min(arrayData.length, Math.max(maxRelevantRow + 2, 5))
        : arrayData.length;

      for (let r = 0; r < rowLimit; r++) {
        const row = arrayData[r] || [];
        const colLimit = (maxRelevantCol >= 0 && row.length > 20)
          ? Math.min(row.length, Math.max(maxRelevantCol + 2, 8))
          : row.length;

        for (let c = 0; c < colLimit; c++) {
          flatData.push({
            value: row[c],
            r: r,
            c: c,
            key: `${r}-${c}`,
            valuePath: `${d3Data.ownerPath ?? 'value'}[${r}][${c}]`,
            label: `[${r}][${c}]`
          });
        }
        if (colLimit < row.length) {
          flatData.push({
            value: '...',
            r: r,
            c: colLimit,
            key: `row-${r}-omitted`,
            valuePath: `__omitted__`,
            label: `+${row.length - colLimit}`,
            isOmitted: true
          });
        }
      }
      if (rowLimit < arrayData.length) {
        flatData.push({
          value: '...',
          r: rowLimit,
          c: 0,
          key: `rows-omitted`,
          valuePath: `__omitted__`,
          label: `+${arrayData.length - rowLimit} vazias`,
          isOmitted: true
        });
      }
    } else {
      let maxRelevantIndex = -1;
      if (arrayData.length > 20) {
        for (let i = 0; i < arrayData.length; i++) {
          if (isValueRelevant(arrayData[i])) {
            maxRelevantIndex = Math.max(maxRelevantIndex, i);
          }
        }
        if (Array.isArray(d3Data.activePointers)) {
          for (const ptr of d3Data.activePointers) {
            if (ptr.active !== false && typeof ptr.value === 'number' && Number.isInteger(ptr.value)) {
              if (ptr.value >= 0 && ptr.value < arrayData.length) {
                maxRelevantIndex = Math.max(maxRelevantIndex, ptr.value);
              }
            }
          }
        }
        if (d3Data.changedPaths instanceof Set) {
          for (const p of d3Data.changedPaths) {
            const match = p.match(/\[(\d+)\]/);
            if (match) {
              const idx = parseInt(match[1], 10);
              if (idx >= 0 && idx < arrayData.length) {
                maxRelevantIndex = Math.max(maxRelevantIndex, idx);
              }
            }
          }
        }
      }

      const displayLimit = arrayData.length > 20
        ? Math.min(arrayData.length, Math.max(maxRelevantIndex + 3, 10))
        : arrayData.length;

      for (let i = 0; i < displayLimit; i++) {
        flatData.push({
          value: arrayData[i],
          r: 0,
          c: i,
          key: `${i}`,
          valuePath: `${d3Data.ownerPath ?? 'value'}[${i}]`,
          label: `[${i}]`
        });
      }

      if (displayLimit < arrayData.length) {
        flatData.push({
          value: '...',
          r: 0,
          c: displayLimit,
          key: 'tail-omitted',
          valuePath: '__omitted__',
          label: `+${arrayData.length - displayLimit}`,
          isOmitted: true
        });
      }
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
      .attr('fill', (d: any) => d.isOmitted ? '#f8fafc' : (isChanged(d.valuePath) ? '#fef08a' : '#fff'))
      .attr('stroke', (d: any) => {
        if (d.isOmitted) return '#94a3b8';
        if (d.valuePath === d3Data.selectedValuePath) return '#ff9800';
        if (isChanged(d.valuePath)) return '#eab308';
        return '#333';
      })
      .attr('stroke-dasharray', (d: any) => d.isOmitted ? '4 4' : null)
      .attr('stroke-width', (d: any) => (d.valuePath === d3Data.selectedValuePath || isChanged(d.valuePath)) ? 3 : (d.isOmitted ? 1.5 : 2));
    allCells.select('text.cell-text').attr('x', cellWidth / 2);
    allCells.select('text.index-text').attr('x', cellWidth / 2);
    allCells.style('cursor', (d: any) => (isStructuredValue(d.value) && !d.isOmitted) ? 'pointer' : 'default')
      .on('click.structured-value', (_event: unknown, d: any) => {
        if (d.isOmitted || !isStructuredValue(d.value)) return;
        toggleStructuredSelection(d3Data, { path: d.valuePath, value: d.value });
        allCells.select('rect')
          .attr('stroke', (cell: any) => cell.isOmitted ? '#94a3b8' : (cell.valuePath === d3Data.selectedValuePath ? '#ff9800' : '#333'))
          .attr('stroke-width', (cell: any) => (cell.valuePath === d3Data.selectedValuePath || isChanged(cell.valuePath)) ? 3 : (cell.isOmitted ? 1.5 : 2));
      });

    const isStack = d3Data.viewMode === 'stack' && !is2D;
    const isQueue = d3Data.viewMode === 'queue' && !is2D;
    const columnCount = is2D
      ? Math.max(1, ...flatData.map((d: any) => d.c + 1))
      : Math.max(1, flatData.length);
    const rowCount = is2D
      ? Math.max(1, ...flatData.map((d: any) => d.r + 1))
      : (isStack ? flatData.length : 1);
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
      .style('font-size', (d: any) => d.isOmitted ? '11px' : (hasStructuredValues ? '10px' : null))
      .style('fill', (d: any) => d.isOmitted ? '#64748b' : null)
      .style('font-style', (d: any) => d.isOmitted ? 'italic' : null);

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

    // Render active variable pointers (e.g. l, r, mid, i) above 1D array cells
    const activePointers: Array<{ path: string; value: unknown; changed?: boolean; active?: boolean }> =
      (!is2D && !isStack && !isQueue && Array.isArray(d3Data.activePointers))
        ? d3Data.activePointers
        : [];

    const pointersByIndex = new Map<number, { names: string[]; hasChanged: boolean }>();
    for (const ptr of activePointers) {
      if (ptr.active === false) continue;
      if (typeof ptr.value === 'number' && Number.isInteger(ptr.value) && ptr.value >= 0 && ptr.value < flatData.length) {
        const cleanName = ptr.path.split('@')[0];
        const existing = pointersByIndex.get(ptr.value) ?? { names: [], hasChanged: false };
        if (!existing.names.includes(cleanName)) {
          existing.names.push(cleanName);
        }
        if (ptr.changed) existing.hasChanged = true;
        pointersByIndex.set(ptr.value, existing);
      }
    }

    allCells.select('title')
      .text((d: any) => {
        if (d.isOmitted) return `${d.label} células não modificadas omitidas para foco nos dados relevantes`;
        const ptrs = pointersByIndex.get(d.c);
        const base = formatArrayCellValue(d.value);
        if (ptrs && ptrs.names.length > 0) {
          return `${base} (Índice ${d.label}, Ponteiros: ${ptrs.names.join(', ')})`;
        }
        return base;
      });

    const pointerItems = Array.from(pointersByIndex.entries()).map(([index, data]) => {
      let label = `▼ ${data.names.join(', ')}`;
      const isCollapsed = data.names.length > 2 || label.length > 14;
      const displayLabel = isCollapsed
        ? `▼ ${data.names[0]} (+${data.names.length - 1})`
        : label;
      return {
        index,
        label: displayLabel,
        fullLabel: `▼ ${data.names.join(', ')}`,
        names: data.names,
        hasChanged: data.hasChanged,
        isCollapsed,
        y: 36
      };
    });

    // Stagger heights if adjacent indices both have pointers to avoid horizontal collision
    pointerItems.sort((a, b) => a.index - b.index);
    let lastIndex = -999;
    let currentLevel = 0;
    for (const item of pointerItems) {
      if (item.index - lastIndex <= 1) {
        currentLevel = (currentLevel + 1) % 2;
      } else {
        currentLevel = 0;
      }
      item.y = currentLevel === 1 ? 20 : 36;
      lastIndex = item.index;
    }

    const pointerSelection = svg.selectAll('text.array-pointer-marker')
      .data(pointerItems, (d: any) => d.index);

    pointerSelection.exit().remove();

    const pointerTexts = pointerSelection.join('text')
      .attr('class', 'array-pointer-marker')
      .attr('x', (d: any) => d.index * (cellWidth + padding) + 40 + cellWidth / 2)
      .attr('y', (d: any) => d.y)
      .attr('text-anchor', 'middle')
      .attr('fill', (d: any) => d.hasChanged ? '#d97706' : '#2563eb')
      .style('font-size', '11px')
      .style('font-weight', 700)
      .style('font-family', 'ui-monospace, monospace')
      .style('cursor', 'pointer')
      .text((d: any) => d.label);

    pointerTexts
      .attr('title', (d: any) => `Ponteiros no índice [${d.index}]: ${d.names.join(', ')}`);

    pointerTexts
      .on('mouseenter', (event: MouseEvent, d: any) => {
        d3.select(event.currentTarget as SVGTextElement)
          .text(d.fullLabel)
          .attr('fill', '#1d4ed8')
          .style('font-size', '12px');
      })
      .on('mouseleave', (event: MouseEvent, d: any) => {
        d3.select(event.currentTarget as SVGTextElement)
          .text(d.label)
          .attr('fill', d.hasChanged ? '#d97706' : '#2563eb')
          .style('font-size', '11px');
      });
  }

}
