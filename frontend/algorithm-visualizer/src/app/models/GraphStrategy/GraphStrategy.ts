import { GraphItem } from "../GraphItem";

export interface GraphStrategy {
    renderizeGraph(svg: any, items: GraphItem[], graphContainer: any): void;

    getPlaceholder(): string;

    getInitialItems(): GraphItem[];

    onPaste(event: ClipboardEvent, index: number, inputs: any, items: GraphItem[], svg: any, graphContainer: any): void;
}