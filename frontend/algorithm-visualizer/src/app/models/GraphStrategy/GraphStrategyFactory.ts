import { Injectable } from "@angular/core";
import { GraphStrategy } from "./GraphStrategy";
import { GraphStrategyDirectedUnweighted } from "./GraphStrategyDirectedUnweighted";
import { GraphStrategyUndirectedUnweighted } from "./GraphStrategyUndirectedUnweighted";
import { GraphStrategyDirectedWeighted } from "./GraphStreategyDirectedWeighted";
import { GraphStrategyUndirectedWeighted } from "./GraphStreategyUndirectedWeighted";
import { GraphService } from "src/app/services/graph.service";
import { Observable, of, throwError } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({ providedIn: 'root' })
export class GraphStrategyFactory {

    constructor(private graphService: GraphService) {}

    private strategies: Record<string, GraphStrategy> = {
        "1,0": new GraphStrategyDirectedUnweighted(this.graphService, null),
        "1,1": new GraphStrategyDirectedWeighted(this.graphService, null),
        "0,0": new GraphStrategyUndirectedUnweighted(this.graphService, null),
        "0,1": new GraphStrategyUndirectedWeighted(this.graphService, null)
    };

    getGraphStrategy(directed: boolean, weighted: boolean, graphId?: string | null): Observable<GraphStrategy> {
        if (graphId == null) {
            const key = `${Number(directed)},${Number(weighted)}`;
            const strategy = this.strategies[key];

            if (!strategy) {
                return throwError(() => new Error("Input não definido para GraphStrategy"));
            }

            return of(strategy);
        }
        
        // editando grafo -> busca as informacoes no banco e escolhe o modelo correspondente
        
        return this.graphService.getGraphById(graphId).pipe(
            map(graphStructure => {
                const key = `${Number(graphStructure.directed)},${Number(graphStructure.weighted)}`;

                const itemStrategies: Record<string, GraphStrategy> = {
                    "1,0": new GraphStrategyDirectedUnweighted(this.graphService, graphStructure.items),
                    "1,1": new GraphStrategyDirectedWeighted(this.graphService, graphStructure.items),
                    "0,0": new GraphStrategyUndirectedUnweighted(this.graphService, graphStructure.items),
                    "0,1": new GraphStrategyUndirectedWeighted(this.graphService, graphStructure.items)
                };

                const strategy = itemStrategies[key];

                if (!strategy) {
                    throw new Error("Input não definido para GraphStrategy");
                }

                return strategy;
            })
        );
    }
}
