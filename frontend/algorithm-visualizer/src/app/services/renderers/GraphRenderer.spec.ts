import { GraphRenderer } from './GraphRenderer';
import * as d3 from 'd3';

describe('GraphRenderer', () => {
  let renderer: GraphRenderer;
  let container: HTMLDivElement;
  let svg: any;

  beforeEach(() => {
    renderer = new GraphRenderer();
    container = document.createElement('div');
    svg = d3.select(container).append('svg').attr('viewBox', '0 0 800 600');
  });

  afterEach(() => {
    svg.remove();
  });

  it('renders curved paths for bidirectional links with arrowhead markers', () => {
    const nodeA: any = { id: '0', value: '0', x: 100, y: 100 };
    const nodeB: any = { id: '1', value: '1', x: 300, y: 100 };
    const links = [
      { source: nodeA, target: nodeB, label: 'wt' },
      { source: nodeB, target: nodeA }
    ];
    const simulation = d3.forceSimulation([nodeA, nodeB])
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('center', d3.forceCenter(400, 300));
    simulation.stop();

    const d3Data = {
      svg,
      nodes: [nodeA, nodeB],
      links,
      simulation,
      ownerPath: 'graph'
    };

    renderer.renderElements(d3Data);

    const paths = container.querySelectorAll<SVGPathElement>('path.edge-path');
    expect(paths.length).toBe(2);
    expect(paths[0].getAttribute('marker-end')).toBe('url(#arrowhead)');
    expect(paths[1].getAttribute('marker-end')).toBe('url(#arrowhead)');

    // Since edges are bidirectional, the paths should contain quadratic curve command Q
    const d0 = paths[0].getAttribute('d');
    const d1 = paths[1].getAttribute('d');
    expect(d0).toContain('Q');
    expect(d1).toContain('Q');

    simulation.stop();
  });

  it('renders straight line path for unidirectional links', () => {
    const nodeA: any = { id: '0', value: '0', x: 100, y: 100 };
    const nodeB: any = { id: '1', value: '1', x: 300, y: 100 };
    const links = [
      { source: nodeA, target: nodeB }
    ];
    const simulation = d3.forceSimulation([nodeA, nodeB])
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('center', d3.forceCenter(400, 300));
    simulation.stop();

    const d3Data = {
      svg,
      nodes: [nodeA, nodeB],
      links,
      simulation,
      ownerPath: 'graph'
    };

    renderer.renderElements(d3Data);

    const paths = container.querySelectorAll<SVGPathElement>('path.edge-path');
    expect(paths.length).toBe(1);
    const d0 = paths[0].getAttribute('d');
    expect(d0).toContain('L');
    expect(d0).not.toContain('Q');

    simulation.stop();
  });
});
