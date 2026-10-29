import type { StructureD3Data } from '../../models/StructureWindow';

export interface Renderer {
  renderElements(d3Data: StructureD3Data): void;
}
