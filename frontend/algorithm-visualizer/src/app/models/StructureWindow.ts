import type { JsonValue } from './ExecutionLogEntry';
import type { StructuredValueSelection } from './StructuredValueSelection';

export interface StructureWindow {
  path: string;      
  type: string;      
  initialized?: boolean;
  isHighlighting?: boolean;
  children: StructureWindow[];
  viewMode?: 'map' | 'graph' | 'array' | 'queue' | 'stack';
  d3Data?: {
    arrayData?: any[],
    viewMode?: 'map' | 'graph' | 'array' | 'queue' | 'stack',
    mapEntries?: Array<{ key: string; value: any; path: string }>,
    ownerPath?: string,
    selectedValuePath?: string,
    selectedValueSnapshot?: JsonValue,
    onStructuredValueSelected?: (selection: StructuredValueSelection | null) => void,
    onNodeHover?: (node: any, event: MouseEvent | null) => void,
    nodes: any[],
    links: any[],
    simulation: any,
    svg: any,
    width: number,
    height: number
  };
}
