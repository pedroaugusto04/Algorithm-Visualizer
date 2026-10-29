import { Injectable } from '@angular/core';
import { Renderer } from './Renderer';
import { isStructuredValue, refreshStructuredSelection, toggleStructuredSelection } from './structured-value-selection';

@Injectable({ providedIn: 'root' })
export class MapRenderer implements Renderer {
  renderElements(d3Data: any): void {
    if (!d3Data?.svg) return;

    const svg = d3Data.svg;
    d3Data.simulation?.stop();
    const entries = d3Data.mapEntries ?? [];
    const svgNode = svg.node() as SVGSVGElement;
    const width = svgNode.clientWidth || d3Data.width || 800;
    const rowHeight = 48;
    const top = 34;
    const left = 32;
    const keyWidth = Math.min(220, Math.max(120, width * 0.3));
    const valueWidth = Math.max(160, width - left * 2 - keyWidth);
    const display = (value: unknown) => {
      if (typeof value === 'string') return value;
      try { return JSON.stringify(value); } catch { return String(value); }
    };

    // Clean any old SVG elements from other view modes if present (e.g. graph links/nodes)
    svg.selectAll('g.links-group, g.nodes-group').remove();

    svg.attr('viewBox', `0 0 ${width} ${Math.max(160, top + (entries.length + 1) * rowHeight)}`)
      .attr('preserveAspectRatio', 'xMinYMin meet');

    let header = svg.select('g.map-header');
    if (header.empty()) {
      header = svg.append('g').attr('class', 'map-header');
      header.append('text').attr('class', 'map-header-key').attr('y', 22).text('KEY')
        .attr('fill', '#64748b').style('font-size', '11px').style('font-weight', 700);
      header.append('text').attr('class', 'map-header-value').attr('y', 22).text('VALUE')
        .attr('fill', '#64748b').style('font-size', '11px').style('font-weight', 700);
    }
    header.select('text.map-header-key').attr('x', left);
    header.select('text.map-header-value').attr('x', left + keyWidth + 12);

    const rows = svg.selectAll('g.map-entry')
      .data(entries, (entry: any) => entry.path);

    const entered = rows.enter().append('g').attr('class', 'map-entry');
    entered.append('rect').attr('rx', 7).attr('fill', '#fff').attr('stroke', '#d8dee8');
    entered.append('line').attr('stroke', '#e2e8f0');
    entered.append('text').attr('class', 'map-key').attr('x', 12).attr('y', 27)
      .attr('fill', '#334155').style('font-family', 'monospace').style('font-weight', 600);
    entered.append('text').attr('class', 'map-value').attr('y', 27)
      .attr('fill', '#1e293b').style('font-family', 'monospace');
    entered.append('title');

    rows.exit().remove();

    const allRows = entered.merge(rows);
    allRows.transition().duration(200)
      .attr('transform', (_entry: any, index: number) => `translate(${left}, ${top + index * rowHeight})`);

    allRows.select('rect')
      .attr('width', keyWidth + valueWidth)
      .attr('height', rowHeight - 5)
      .attr('stroke', (entry: any) => entry.path === d3Data.selectedValuePath ? '#ff9800' : '#d8dee8')
      .attr('stroke-width', (entry: any) => entry.path === d3Data.selectedValuePath ? 2 : 1);
    allRows.select('line').attr('x1', keyWidth).attr('x2', keyWidth).attr('y1', 0).attr('y2', rowHeight - 5);
    allRows.select('.map-key').text((entry: any) => entry.key);
    allRows.select('.map-value').attr('x', keyWidth + 12).text((entry: any) => display(entry.value).slice(0, 100));
    allRows.select('title').text((entry: any) => `${entry.key}: ${display(entry.value)}`);

    refreshStructuredSelection(d3Data, entries
      .filter((entry: any) => isStructuredValue(entry.value))
      .map((entry: any) => ({ path: entry.path, value: entry.value })));
    rows.style('cursor', (entry: any) => isStructuredValue(entry.value) ? 'pointer' : 'default')
      .on('click.structured-value', (_event: unknown, entry: any) => {
        if (!isStructuredValue(entry.value)) return;
        toggleStructuredSelection(d3Data, { path: entry.path, value: entry.value });
      });
  }
}
