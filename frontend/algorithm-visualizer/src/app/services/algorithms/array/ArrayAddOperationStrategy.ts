import { ExecutionLogEntry } from "src/app/models/ExecutionLogEntry";
import { StructureWindow } from "src/app/models/StructureWindow";
import { AlgorithmOperationStrategy } from "../AlgorithmOperationStrategy";
import { Injectable } from "@angular/core";
import { ArrayRenderer } from "../../renderers/ArrayRenderer";

@Injectable({ providedIn: 'root' })
export class ArrayAddOperationStrategy implements AlgorithmOperationStrategy {

  constructor(private globalRenderer: ArrayRenderer) { }

  execute(structure: StructureWindow, entry: ExecutionLogEntry, skipRender: boolean): void {

    if (!structure.d3Data) {
      structure.d3Data = {
        nodes: [] as any[],
        links: [] as any[],
        simulation: null,
        svg: null,
        width: 800,
        height: 600
      };
    }

    if (!structure.d3Data.arrayData) structure.d3Data.arrayData = [];

    structure.d3Data.arrayData.push(entry.value);

    if (skipRender) return;

    this.globalRenderer.renderElements(structure.d3Data);
  }

}