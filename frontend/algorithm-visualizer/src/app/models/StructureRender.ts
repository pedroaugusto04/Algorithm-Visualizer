import { StructureState } from "./StructureState";

export interface StructureRenderer {
  render(state: StructureState): void;
}