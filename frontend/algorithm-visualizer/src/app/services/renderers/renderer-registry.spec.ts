import { TestBed } from '@angular/core/testing';
import { RendererRegistry } from './renderer-registry';
import { ArrayRenderer } from './ArrayRenderer';
import { GraphRenderer } from './GraphRenderer';
import { MapRenderer } from './MapRenderer';

describe('RendererRegistry', () => {
  let registry: RendererRegistry;
  let arrayRenderer: ArrayRenderer;
  let graphRenderer: GraphRenderer;
  let mapRenderer: MapRenderer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RendererRegistry, ArrayRenderer, GraphRenderer, MapRenderer]
    });
    registry = TestBed.inject(RendererRegistry);
    arrayRenderer = TestBed.inject(ArrayRenderer);
    graphRenderer = TestBed.inject(GraphRenderer);
    mapRenderer = TestBed.inject(MapRenderer);
  });

  it('resolves array renderer for default array view mode', () => {
    expect(registry.getRenderer('array', 'array')).toBe(arrayRenderer);
    expect(registry.getRenderer('array', 'queue')).toBe(arrayRenderer);
    expect(registry.getRenderer('array', 'stack')).toBe(arrayRenderer);
    expect(registry.getRenderer('array')).toBe(arrayRenderer);
  });

  it('resolves graph renderer for array viewed as graph', () => {
    expect(registry.getRenderer('array', 'graph')).toBe(graphRenderer);
  });

  it('resolves map and graph renderers for map structures', () => {
    expect(registry.getRenderer('map', 'map')).toBe(mapRenderer);
    expect(registry.getRenderer('map', 'graph')).toBe(graphRenderer);
    expect(registry.getRenderer('map')).toBe(mapRenderer);
  });

  it('returns null for unknown structure types without fallback', () => {
    expect(registry.getRenderer('unknown_structure_type')).toBeNull();
  });
});
