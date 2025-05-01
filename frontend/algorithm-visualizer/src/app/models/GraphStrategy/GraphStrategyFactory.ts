import { Injectable } from "@angular/core";
import { GraphStrategy } from "./GraphStrategy";
import { GraphStrategyDirectedUnweighted } from "./GraphStrategyDirectedUnweighted";
import { GraphStrategyUndirectedUnweighted } from "./GraphStrategyUndirectedUnweighted";
import { GraphStrategyDirectedWeighted } from "./GraphStreategyDirectedWeighted";
import { GraphStrategyUndirectedWeighted } from "./GraphStreategyUndirectedWeighted";
import { GraphService } from "src/app/services/graph.service";

@Injectable({ providedIn: 'root' })
export class GraphStrategyFactory {

    constructor(private graphService: GraphService){}

    private strategies: Record<string, GraphStrategy> = {
        "1,0": new GraphStrategyDirectedUnweighted(this.graphService),
        "1,1": new GraphStrategyDirectedWeighted(this.graphService),
        "0,0": new GraphStrategyUndirectedUnweighted(this.graphService),
        "0,1": new GraphStrategyUndirectedWeighted(this.graphService)
    };

     getGraphStrategy(directed: boolean, weighted: boolean): GraphStrategy {

        const key = `${Number(directed)},${Number(weighted)}`;
        
        const strategy = this.strategies[key];

        if (!strategy) {
            throw new Error("Input não definido para GraphStrategy");
        }

        return strategy;
    }
}
