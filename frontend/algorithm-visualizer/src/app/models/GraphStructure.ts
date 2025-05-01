import { GraphItem } from "./GraphItem";

export interface GraphStructure {
    id?: string;
    items: GraphItem[];
    directed: boolean;
    weighted: boolean;
}