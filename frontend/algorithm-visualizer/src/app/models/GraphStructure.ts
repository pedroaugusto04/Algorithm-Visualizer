import { GraphItem } from "./GraphItem";

export interface GraphStructure {
    id?: string | null;
    items: GraphItem[];
    directed: boolean;
    weighted: boolean;
}