import { GraphItem } from "../GraphItem";
import { GRAPH_NOT_WEIGHTED_ITEMS } from "../Utils/GraphItemUtils";
import { GraphStrategy } from "./GraphStrategy";
import * as d3 from 'd3';

export class GraphStrategyDirectedNotWeighted implements GraphStrategy {

    onPaste(event: ClipboardEvent, index: number, inputs: any, items: GraphItem[], svg: any, graphContainer: any): void {
        setTimeout(() => {
            const input = inputs.toArray()[index]?.nativeElement as HTMLInputElement;
            const value = input.value.trim();
      
            const parts = value.split(/\s+/);
      
            if (parts.length > 1) {
              const newItems = [];
      
              for (let i = 0; i < parts.length; i += 2) {
                const pair = [parts[i], parts[i + 1]].filter(Boolean).join(' ');
                if (pair) {
                  newItems.push({ text: pair });
                }
              }
      
              items.splice(index, 1, ...newItems);
      
              setTimeout(() => this.focusLastInput(inputs), 0);
            }
            this.renderizeGraph(svg,items,graphContainer);
          }, 0);
    }

    private focusLastInput(inputs: any) {
        const inputsArray = inputs.toArray();
        if (inputsArray.length > 0) {
          inputsArray[inputsArray.length - 1].nativeElement.focus();
        }
    }

    getInitialItems(): GraphItem[] {
        return GRAPH_NOT_WEIGHTED_ITEMS;
    }

    getPlaceholder(): string {
        return "v1 v2"
    }

    renderizeGraph(svg: any, items: any[], graphContainer: any): void {
       d3.select(graphContainer.nativeElement).select('svg').remove();
    }
}