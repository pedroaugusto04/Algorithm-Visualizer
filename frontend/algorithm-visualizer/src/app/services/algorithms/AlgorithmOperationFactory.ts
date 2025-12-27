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

@Injectable({ providedIn: 'root' })
export class AlgorithmOperationFactory {

  private strategies: {
    [type: string]: {
      [operation: string]: AlgorithmOperationStrategy
    }
  };

  constructor(
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

  getStrategy(type: string, operation: string): AlgorithmOperationStrategy | null {
    return this.strategies[type]?.[operation] || null;
  }
}
