import { Injectable } from '@angular/core';
import { Renderer } from './Renderer';
import { ArrayRenderer } from './ArrayRenderer';
import { GraphRenderer } from './GraphRenderer';
import { MapRenderer } from './MapRenderer';
import { StructureViewMode } from '../../models/StructureWindow';

@Injectable({ providedIn: 'root' })
export class RendererRegistry {
  private registry = new Map<string, Renderer>();

  constructor(
    arrayRenderer: ArrayRenderer,
    graphRenderer: GraphRenderer,
    mapRenderer: MapRenderer
  ) {
    this.registry.set('array:array', arrayRenderer);
    this.registry.set('array:queue', arrayRenderer);
    this.registry.set('array:stack', arrayRenderer);
    this.registry.set('array:graph', graphRenderer);
    this.registry.set('map:map', mapRenderer);
    this.registry.set('map:graph', graphRenderer);
    // Defaults by type
    this.registry.set('array', arrayRenderer);
    this.registry.set('map', mapRenderer);
    this.registry.set('graph', graphRenderer);
  }

  getRenderer(type: string, viewMode?: StructureViewMode): Renderer | null {
    if (viewMode) {
      const specific = this.registry.get(`${type}:${viewMode}`);
      if (specific) return specific;
      const modeFallback = this.registry.get(viewMode);
      if (modeFallback) return modeFallback;
    }
    return this.registry.get(type) ?? null;
  }
}
