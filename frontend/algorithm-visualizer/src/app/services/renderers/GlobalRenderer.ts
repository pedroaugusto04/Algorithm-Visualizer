import { Injectable } from '@angular/core';
import { RendererRegistry } from './renderer-registry';
import { StructureWindow } from 'src/app/models/StructureWindow';

@Injectable({ providedIn: 'root' })
export class GlobalRenderer {
  constructor(private registry: RendererRegistry) {}

  renderElements(structures: StructureWindow[]): void {
    for (const structure of structures) {
      const data = structure.d3Data;
      if (!data?.svg) continue;
      const nextMode = `${structure.type}:${structure.viewMode ?? structure.type}`;
      if (data.renderedMode && data.renderedMode !== nextMode) {
        data.simulation?.stop();
        data.simulation = null;
        data.svg.selectAll('*').remove();
      }
      data.viewMode = structure.viewMode;

      const renderer = this.registry.getRenderer(structure.type, structure.viewMode);
      renderer?.renderElements(data);
      data.renderedMode = nextMode;
    }
  }
}
