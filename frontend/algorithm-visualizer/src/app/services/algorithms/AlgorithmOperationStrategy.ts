import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";


export interface AlgorithmOperationStrategy {
    execute(structure: StructureWindow, structrures: StructureWindow[], entry: ExecutionLogEntry, skipRender: boolean): void;
}