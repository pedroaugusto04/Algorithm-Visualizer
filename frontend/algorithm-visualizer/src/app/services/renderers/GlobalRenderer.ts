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
      data.viewMode = structure.viewMode;

      const renderer = this.registry.getRenderer(structure.type, structure.viewMode);
      renderer?.renderElements(data);
    }
  }
}
