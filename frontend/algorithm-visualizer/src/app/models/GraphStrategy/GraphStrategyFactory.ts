import { GraphStrategy } from "./GraphStrategy";
import { GraphStrategyDirectedNotWeighted } from "./GraphStrategyDirectedNotWeighted";
import { GraphStrategyUndirectedNotWeighted} from "./GraphStrategyUndirectedNotWeighted";
import { GraphStrategyDirectedWeighted } from "./GraphStreategyDirectedWeighted";
import { GraphStrategyUndirectedWeighted } from "./GraphStreategyUndirectedWeighted";

export class GraphStrategyFactory {

    private static strategies: Record<string, GraphStrategy> = {
        "0,0": new GraphStrategyDirectedNotWeighted(),
        "0,1": new GraphStrategyDirectedWeighted(),
        "1,0": new GraphStrategyUndirectedNotWeighted(),
        "1,1": new GraphStrategyUndirectedWeighted()
    };

    static getGraphStrategy(x: string, y: string): GraphStrategy {
        const key = `${x},${y}`;
        const strategy = this.strategies[key];

        if (!strategy) {
            throw new Error("Input não definido para GraphStrategy");
        }

        return strategy;
    }
}
