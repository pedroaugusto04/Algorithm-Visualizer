import type { JsonValue } from './ExecutionLogEntry';
import type { StructuredValueSelection } from './StructuredValueSelection';
import type { MapVisualNode, MapVisualLink } from '../services/renderers/map-snapshot';

export type StructureViewMode = 'map' | 'graph' | 'array' | 'queue' | 'stack';

export interface StructureD3Data {
  arrayData?: any[];
  viewMode?: StructureViewMode;
  mapEntries?: Array<{ key: string; value: any; path: string }>;
  ownerPath?: string;
  changedPaths?: Set<string>;
  selectedValuePath?: string;
  selectedValueSnapshot?: JsonValue;
  onStructuredValueSelected?: (selection: StructuredValueSelection | null) => void;
  onNodeHover?: (node: any, event: MouseEvent | null) => void;
  nodes: MapVisualNode[];
  links: MapVisualLink[];
  simulation?: any;
  svg?: any;
  width: number;
  height: number;
}

export interface StructureWindow {
  path: string;
  type: string;
  initialized?: boolean;
  isHighlighting?: boolean;
  viewMode?: StructureViewMode;
  d3Data?: StructureD3Data;
}

export function createStructureWindow(
  path: string,
  type: string,
  viewMode?: StructureViewMode
): StructureWindow {
  return {
    path,
    type,
    viewMode: viewMode || (type === 'map' ? 'map' : 'array'),
    d3Data: {
      arrayData: [],
      nodes: [],
      links: [],
      simulation: null,
      svg: null,
      width: 800,
      height: 600
    }
  };
}
