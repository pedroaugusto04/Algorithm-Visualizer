import { GraphItem } from "./GraphItem";

export interface GraphStructure {
    graphItem: GraphItem[];
    directed: boolean;
    weighted: boolean;
}