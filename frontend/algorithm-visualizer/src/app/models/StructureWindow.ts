export interface StructureWindow {
  path: string;      
  type: string;      
  initialized?: boolean;
  isHighlighting?: boolean;
  children: StructureWindow[];
  viewMode?: 'map' | 'graph' | 'array';
  d3Data?: {
    arrayData?: any[],
    nodes: any[],
    links: any[],
    simulation: any,
    svg: any,
    width: number,
    height: number
  };
}