import { GraphLinkState } from "./GraphLinkState";
import { GraphNodeState } from "./GraphNodeState";

export interface StructureState {
  nodes?: GraphNodeState[];
  links?: GraphLinkState[];
  array?: any[];
}
