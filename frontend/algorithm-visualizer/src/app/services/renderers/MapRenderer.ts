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

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${Math.max(160, top + (entries.length + 1) * rowHeight)}`)
      .attr('preserveAspectRatio', 'xMinYMin meet');

    const header = svg.append('g').attr('class', 'map-header');
    header.append('text').attr('x', left).attr('y', 22).text('KEY')
      .attr('fill', '#64748b').style('font-size', '11px').style('font-weight', 700);
    header.append('text').attr('x', left + keyWidth + 12).attr('y', 22).text('VALUE')
      .attr('fill', '#64748b').style('font-size', '11px').style('font-weight', 700);

    const rows = svg.selectAll('g.map-entry').data(entries, (entry: any) => entry.path)
      .join('g').attr('class', 'map-entry')
      .attr('transform', (_entry: any, index: number) => `translate(${left}, ${top + index * rowHeight})`);

    rows.append('rect').attr('width', keyWidth + valueWidth).attr('height', rowHeight - 5)
      .attr('rx', 7).attr('fill', '#fff').attr('stroke', '#d8dee8');
    rows.append('line').attr('x1', keyWidth).attr('x2', keyWidth).attr('y1', 0).attr('y2', rowHeight - 5)
      .attr('stroke', '#e2e8f0');
    rows.append('text').attr('class', 'map-key').attr('x', 12).attr('y', 27)
      .attr('fill', '#334155').style('font-family', 'monospace').style('font-weight', 600);
    rows.append('text').attr('class', 'map-value').attr('x', keyWidth + 12).attr('y', 27)
      .attr('fill', '#1e293b').style('font-family', 'monospace');
    rows.select('.map-key').text((entry: any) => entry.key);
    rows.select('.map-value').text((entry: any) => display(entry.value).slice(0, 100));
    rows.append('title').text((entry: any) => `${entry.key}: ${display(entry.value)}`);

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
