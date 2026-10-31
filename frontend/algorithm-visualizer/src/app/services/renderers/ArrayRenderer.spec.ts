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

  it('renders variable pointer markers above 1D array cells', () => {
    const d3Data = {
      svg,
      arrayData: [10, 20, 30, 40, 50],
      viewMode: 'array',
      ownerPath: 'arr',
      activePointers: [
        { path: 'l', value: 0, changed: false },
        { path: 'mid', value: 2, changed: true },
        { path: 'r', value: 4, changed: false },
      ]
    };

    renderer.renderElements(d3Data);

    const pointers = container.querySelectorAll<SVGTextElement>('text.array-pointer-marker');
    expect(pointers.length).toBe(3);

    const labels = Array.from(pointers).map(p => p.textContent);
    expect(labels).toContain('▼ l');
    expect(labels).toContain('▼ mid');
    expect(labels).toContain('▼ r');
  });

  it('groups multiple variable pointers at the same cell index', () => {
    const d3Data = {
      svg,
      arrayData: [10, 20, 30],
      viewMode: 'array',
      ownerPath: 'arr',
      activePointers: [
        { path: 'l', value: 1, changed: false },
        { path: 'r', value: 1, changed: false },
      ]
    };

    renderer.renderElements(d3Data);

    const pointers = container.querySelectorAll<SVGTextElement>('text.array-pointer-marker');
    expect(pointers.length).toBe(1);
    expect(pointers[0].textContent).toBe('▼ l, r');
  });

  it('collapses more than 2 variable pointers at the same cell index', () => {
    const d3Data = {
      svg,
      arrayData: [10, 20, 30],
      viewMode: 'array',
      ownerPath: 'arr',
      activePointers: [
        { path: 'u', value: 1, changed: false },
        { path: 'v', value: 1, changed: false },
        { path: 'head', value: 1, changed: false },
      ]
    };

    renderer.renderElements(d3Data);

    const pointers = container.querySelectorAll<SVGTextElement>('text.array-pointer-marker');
    expect(pointers.length).toBe(1);
    expect(pointers[0].textContent).toBe('▼ u (+2)');
    expect(pointers[0].getAttribute('title')).toContain('u, v, head');
  });

  it('staggers vertically pointer markers on adjacent indices to avoid overlapping', () => {
    const d3Data = {
      svg,
      arrayData: [10, 20, 30, 40],
      viewMode: 'array',
      ownerPath: 'arr',
      activePointers: [
        { path: 'i', value: 1, changed: false },
        { path: 'j', value: 2, changed: false },
      ]
    };

    renderer.renderElements(d3Data);

    const pointers = Array.from(container.querySelectorAll<SVGTextElement>('text.array-pointer-marker'));
    expect(pointers.length).toBe(2);
    const y1 = parseFloat(pointers[0].getAttribute('y') || '0');
    const y2 = parseFloat(pointers[1].getAttribute('y') || '0');
    expect(y1).not.toBe(y2);
  });

  it('slices large arrays with trailing default zeros to show only relevant elements and an omitted marker', () => {
    const largeArr = new Array(100).fill(0);
    largeArr[0] = 42;
    largeArr[1] = 99;
    largeArr[2] = 7;

    const d3Data = {
      svg,
      arrayData: largeArr,
      viewMode: 'array',
      ownerPath: 'arr',
      activePointers: []
    };

    renderer.renderElements(d3Data);

    const cells = container.querySelectorAll<SVGRectElement>('rect');
    expect(cells.length).toBeLessThan(15);

    const omittedLabel = Array.from(container.querySelectorAll<SVGTextElement>('text.index-text'))
      .find(t => t.textContent?.startsWith('+'));
    expect(omittedLabel).toBeDefined();
    expect(omittedLabel!.textContent).toMatch(/\+\d+/);
  });
});
