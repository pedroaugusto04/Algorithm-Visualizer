import type { JsonValue } from './ExecutionLogEntry';
import type { StructuredValueSelection } from './StructuredValueSelection';

export interface StructureWindow {
  path: string;      
  type: string;      
  initialized?: boolean;
  isHighlighting?: boolean;
  children: StructureWindow[];
  viewMode?: 'map' | 'graph' | 'array';
  d3Data?: {
    arrayData?: any[],
    ownerPath?: string,
    selectedValuePath?: string,
    selectedValueSnapshot?: JsonValue,
    onStructuredValueSelected?: (selection: StructuredValueSelection | null) => void,
    nodes: any[],
    links: any[],
    simulation: any,
    svg: any,
    width: number,
    height: number
  };
}
