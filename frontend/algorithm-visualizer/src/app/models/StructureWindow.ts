export interface StructureWindow {
  path: string;      
  fullPath: string; 
  type: string;      
  initialized?: boolean;
  isHighlighting?: boolean;
  children: StructureWindow[];
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