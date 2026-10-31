import { ArrayRenderer, formatArrayCellValue } from './ArrayRenderer';
import * as d3 from 'd3';

describe('formatArrayCellValue', () => {
  it('keeps primitive values concise', () => {
    expect(formatArrayCellValue(42)).toBe('42');
    expect(formatArrayCellValue(true)).toBe('true');
    expect(formatArrayCellValue('node')).toBe('node');
    expect(formatArrayCellValue(null)).toBe('');
  });

  it('formats structs and nested values as readable JSON', () => {
    expect(formatArrayCellValue({
      name: 'A',
      edges: [{ to: 2, weight: 7 }]
    })).toBe('{"name":"A","edges":[{"to":2,"weight":7}]}');
  });
});

describe('ArrayRenderer', () => {
  let renderer: ArrayRenderer;
  let container: HTMLDivElement;
  let svg: any;

  beforeEach(() => {
    renderer = new ArrayRenderer();
    container = document.createElement('div');
    svg = d3.select(container).append('svg');
  });

  afterEach(() => {
    svg.remove();
  });

  it('renders stack elements with TOP at index 0 and BOTTOM at the base', () => {
    // In C++, stack serialization emits [top, ..., bottom], so [30, 20, 10]
    const d3Data = {
      svg,
      arrayData: [30, 20, 10],
      viewMode: 'stack',
      ownerPath: 'lifo'
    };

    renderer.renderElements(d3Data);

    const markers = container.querySelectorAll<SVGTextElement>('text.array-end-marker');
    expect(markers.length).toBe(2);

    const labels = Array.from(markers).map(m => m.textContent);
    expect(labels).toContain('TOP');
    expect(labels).toContain('BOTTOM');

    const topMarker = Array.from(markers).find(m => m.textContent === 'TOP');
    const bottomMarker = Array.from(markers).find(m => m.textContent === 'BOTTOM');

    // TOP should be vertically above BOTTOM (smaller y value in SVG)
    const topY = parseFloat(topMarker!.getAttribute('y') || '0');
    const bottomY = parseFloat(bottomMarker!.getAttribute('y') || '0');
    expect(topY).toBeLessThan(bottomY);
  });
});
