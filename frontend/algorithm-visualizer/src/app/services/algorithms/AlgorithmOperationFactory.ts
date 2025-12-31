import { Injectable } from "@angular/core";
import { AlgorithmOperationStrategy } from "./AlgorithmOperationStrategy";
import { GraphAddOperationStrategy } from "./graph/GraphAddOperationStrategy";
import { GraphRemoveOperationStrategy } from "./graph/GraphRemoveOperationStrategy";
import { GraphUpdateOperationStrategy } from "./graph/GraphUpdateOperationStrategy";
import { GraphAccessOperationStrategy } from "./graph/GraphAccessOperationStrategy";
import { ArrayAccessOperationStrategy } from "./array/ArrayAccessOperationStrategy";
import { ArrayAddOperationStrategy } from "./array/ArrayAddOperationStrategy";
import { ArrayRemoveOperationStrategy } from "./array/ArrayRemoveOperationStrategy";
import { ArrayUpdateOperationStrategy } from "./array/ArrayUpdateOperationStrategy";
import { MapAccessOperationStrategy } from "./map/MapAccessOperationStrategy";
import { MapAddOperationStrategy } from "./map/MapAddOperationStrategy";
import { MapUpdateOperationStrategy } from "./map/MapUpdateOperationStrategy";
import { MapRemoveOperationStrategy } from "./map/MapRemoveOperationStrategy";

@Injectable({ providedIn: 'root' })
export class AlgorithmOperationFactory {

  private strategies: {
    [type: string]: {
      [operation: string]: AlgorithmOperationStrategy
    }
  };

  constructor(
    private mapAccess: MapAccessOperationStrategy,
    private mapAdd: MapAddOperationStrategy,
    private mapUpdate: MapUpdateOperationStrategy,
    private mapDelete: MapRemoveOperationStrategy,
    private graphAccess: GraphAccessOperationStrategy,
    private graphAdd: GraphAddOperationStrategy,
    private graphUpdate: GraphUpdateOperationStrategy,
    private graphDelete: GraphRemoveOperationStrategy,
    private arrayAccess: ArrayAccessOperationStrategy,
    private arrayAdd: ArrayAddOperationStrategy,
    private arrayUpdate: ArrayUpdateOperationStrategy,
    private arrayDelete: ArrayRemoveOperationStrategy
  ) {
    this.strategies = {
      map: {
        access: this.mapAccess,
        add: this.mapAdd,
        update: this.mapUpdate,
        remove: this.mapDelete
      },
      graph: {
        access: this.graphAccess,
        add: this.graphAdd,
        update: this.graphUpdate,
        remove: this.graphDelete
      },
      array: {
        access: this.arrayAccess,
        add: this.arrayAdd,
        update: this.arrayUpdate,
        remove: this.arrayDelete
      }
    };
  }

  getStrategy(type: string, viewMode: string, operation: string): AlgorithmOperationStrategy | null {

    let effectiveType = type;

    if (type === 'map' && viewMode === 'graph') {
      effectiveType = 'graph';
    }

    return this.strategies[effectiveType]?.[operation] || null;
  }
}
