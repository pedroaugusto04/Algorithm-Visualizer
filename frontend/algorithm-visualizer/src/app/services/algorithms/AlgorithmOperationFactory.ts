import { Injectable } from "@angular/core";
import { AlgorithmOperationStrategy } from "./AlgorithmOperationStrategy";
import { SnapshotOperationStrategy } from "./SnapshotOperationStrategy";

@Injectable({ providedIn: 'root' })
export class AlgorithmOperationFactory {

  constructor(private snapshot: SnapshotOperationStrategy) {}

  getStrategy(type: string, viewMode: string, operation: string): AlgorithmOperationStrategy | null {

    let effectiveType = type;

    if (type === 'map' && viewMode === 'graph') {
      effectiveType = 'graph';
    }

    if (operation !== 'snapshot') return null;
    return effectiveType === 'map' || effectiveType === 'graph' || effectiveType === 'array'
      ? this.snapshot
      : null;
  }
}
