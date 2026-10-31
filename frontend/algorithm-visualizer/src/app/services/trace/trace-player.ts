import { ExecutionLogEntry, JsonValue } from '../../models/ExecutionLogEntry';

export interface StructureStateSnapshot {
  path: string;
  type: string;
  value: JsonValue;
  active: boolean;
  initialized?: boolean;
  frame?: number;
  func?: string;
  depth?: number;
}

export interface KnownStructure {
  path: string;
  type: string;
  initialValue: JsonValue;
  frame?: number;
  func?: string;
  depth?: number;
}

export class TracePlayer {
  readonly entries: readonly ExecutionLogEntry[];
  readonly initialEntries: readonly ExecutionLogEntry[];
  readonly operations: readonly ExecutionLogEntry[];

  private readonly operationIndicesByPath = new Map<string, number[]>();
  private readonly knownStructures = new Map<string, KnownStructure>();

  private animationTimer: any = null;
  private _currentStep = -1;

  constructor(allEntries: ExecutionLogEntry[]) {
    this.entries = Object.freeze([...allEntries]);
    this.initialEntries = Object.freeze(allEntries.filter(e => e.op === 'init'));
    this.operations = Object.freeze(allEntries.filter(e => e.op !== 'init'));

    this.initialEntries.forEach(entry => {
      const rootPath = this.extractRootPath(entry.path);
      if (!this.knownStructures.has(rootPath)) {
        this.knownStructures.set(rootPath, {
          path: rootPath,
          type: entry.type,
          initialValue: entry.value,
          frame: entry.frame,
          func: entry.func,
          depth: entry.depth,
        });
      }
    });

    this.operations.forEach((entry, index) => {
      const rootPath = this.extractRootPath(entry.path);
      const indices = this.operationIndicesByPath.get(rootPath) ?? [];
      indices.push(index);
      this.operationIndicesByPath.set(rootPath, indices);

      if (!this.knownStructures.has(rootPath)) {
        this.knownStructures.set(rootPath, {
          path: rootPath,
          type: entry.type,
          initialValue: null,
          frame: entry.frame,
          func: entry.func,
          depth: entry.depth,
        });
      }
    });
  }

  get totalSteps(): number {
    return this.operations.length;
  }

  get currentStep(): number {
    return this._currentStep;
  }

  get isPlaying(): boolean {
    return this.animationTimer !== null;
  }

  get structures(): KnownStructure[] {
    return Array.from(this.knownStructures.values());
  }

  extractRootPath(path: string): string {
    return path.split('[')[0];
  }

  activeLine(step: number = this._currentStep): number | null {
    if (step < 0 || step >= this.operations.length) return null;
    return this.operations[step]?.line ?? null;
  }

  activeEntry(step: number = this._currentStep): ExecutionLogEntry | null {
    if (step < 0 || step >= this.operations.length) return null;
    return this.operations[step] ?? null;
  }

  activeRootPath(step: number = this._currentStep): string | null {
    const entry = this.activeEntry(step);
    return entry ? this.extractRootPath(entry.path) : null;
  }

  /** Maps an operations-step index to the corresponding index in `this.entries`. */
  entryIndexForStep(step: number = this._currentStep): number {
    if (step < 0 || step >= this.operations.length) return -1;
    const op = this.operations[step];
    return (this.entries as ExecutionLogEntry[]).indexOf(op);
  }

  stateAt(step: number, rootPath: string): StructureStateSnapshot | null {
    const known = this.knownStructures.get(rootPath);
    if (!known) return null;

    if (step < 0) {
      const isInit = known.initialValue !== null && known.initialValue !== undefined;
      return {
        path: rootPath,
        type: known.type,
        value: known.initialValue,
        active: isInit,
        initialized: isInit,
        frame: known.frame,
        func: known.func,
        depth: known.depth,
      };
    }

    const indices = this.operationIndicesByPath.get(rootPath) ?? [];
    let match = -1;
    let low = 0;
    let high = indices.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (indices[mid] <= step) {
        match = indices[mid];
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (match < 0) {
      const isInit = known.initialValue !== null && known.initialValue !== undefined;
      return {
        path: rootPath,
        type: known.type,
        value: known.initialValue,
        active: isInit,
        initialized: isInit,
        frame: known.frame,
        func: known.func,
        depth: known.depth,
      };
    }

    const entry = this.operations[match];
    let lastValue: JsonValue = entry.value;

    if (entry.op === 'exit') {
      let prevIdx: number | undefined;
      for (const idx of indices) {
        if (idx >= match) break;
        prevIdx = idx;
      }
      lastValue = prevIdx !== undefined ? this.operations[prevIdx].value : known.initialValue;
      return {
        path: rootPath,
        type: known.type,
        value: lastValue,
        active: false,
        initialized: true,
        frame: entry.frame,
        func: entry.func,
        depth: entry.depth,
      };
    }

    return {
      path: rootPath,
      type: known.type,
      value: entry.value,
      active: true,
      initialized: true,
      frame: entry.frame,
      func: entry.func,
      depth: entry.depth,
    };
  }

  allStatesAt(step: number): Map<string, StructureStateSnapshot> {
    const states = new Map<string, StructureStateSnapshot>();
    for (const rootPath of this.knownStructures.keys()) {
      const state = this.stateAt(step, rootPath);
      if (state) states.set(rootPath, state);
    }
    return states;
  }

  changeSummaryAt(step: number = this._currentStep): string {
    const entry = this.activeEntry(step);
    if (!entry) return 'Execute the program to inspect its changes.';

    const rootPath = this.extractRootPath(entry.path);
    if (entry.op === 'exit') {
      const funcInfo = entry.func ? ` (${entry.func})` : '';
      return `${rootPath}: escopo encerrado${funcInfo}`;
    }

    const indices = this.operationIndicesByPath.get(rootPath) ?? [];
    let previousIndex: number | undefined;
    for (const index of indices) {
      if (index >= step) break;
      previousIndex = index;
    }

    const initial = this.knownStructures.get(rootPath)?.initialValue;
    const previous = previousIndex === undefined ? initial : this.operations[previousIndex].value;

    if (previous === undefined || previous === null) {
      return `${entry.path}: initialized as ${this.describeValue(entry.value)}`;
    }

    const differences = this.findDifferences(previous, entry.value);
    if (differences.length === 0) return `${entry.path}: value updated`;

    const suffix = differences.length > 2 ? ` (+${differences.length - 2} more)` : '';
    const formatted = differences.slice(0, 2).map(difference =>
      difference.startsWith('[') || difference.startsWith('.') ? `${rootPath}${difference}` : difference
    );
    return `${formatted.join(' · ')}${suffix}`;
  }

  changedPathsAt(step: number = this._currentStep): Set<string> {
    const paths = new Set<string>();
    if (step < 0 || step >= this.entries.length) return paths;

    const entry = this.entries[step];
    // Scope exit does not modify variable value
    if (entry.op === 'exit') {
      return paths;
    }

    const rootPath = this.extractRootPath(entry.path);

    // For init events, everything is new — compare against undefined
    if (entry.op === 'init') {
      this.collectChangedPaths(undefined, entry.value, rootPath, paths);
      return paths;
    }

    // Find the most recent prior entry for this rootPath
    let previous: unknown = this.knownStructures.get(rootPath)?.initialValue;
    for (let i = step - 1; i >= 0; i--) {
      if (this.extractRootPath(this.entries[i].path) === rootPath && this.entries[i].op !== 'exit') {
        previous = this.entries[i].value;
        break;
      }
    }

    this.collectChangedPaths(previous, entry.value, rootPath, paths);
    return paths;
  }

  private collectChangedPaths(previous: unknown, current: unknown, path: string, result: Set<string>): void {
    if (previous !== undefined && JSON.stringify(previous) === JSON.stringify(current)) return;
    result.add(path);

    if (Array.isArray(previous) && Array.isArray(current)) {
      const length = Math.max(previous.length, current.length);
      for (let i = 0; i < length; i++) {
        const nextPath = `${path}[${i}]`;
        if (i >= previous.length || i >= current.length || JSON.stringify(previous[i]) !== JSON.stringify(current[i])) {
          result.add(nextPath);
          this.collectChangedPaths(previous[i], current[i], nextPath, result);
        }
      }
      return;
    }

    // When previous is undefined/null, mark all children of current as changed
    if (previous === undefined || previous === null) {
      if (Array.isArray(current)) {
        current.forEach((_, i) => result.add(`${path}[${i}]`));
      } else if (this.isRecord(current)) {
        Object.keys(current).forEach(key => result.add(`${path}[${key}]`));
      }
      return;
    }

    if (this.isRecord(previous) && this.isRecord(current)) {
      const keys = new Set([...Object.keys(previous), ...Object.keys(current)]);
      for (const key of keys) {
        const nextPath = `${path}[${key}]`;
        if (!(key in previous) || !(key in current) || JSON.stringify(previous[key]) !== JSON.stringify(current[key])) {
          result.add(nextPath);
          this.collectChangedPaths(previous[key], current[key], nextPath, result);
        }
      }
    }
  }

  seek(step: number): number {
    const clamped = Math.max(-1, Math.min(step, this.totalSteps - 1));
    this._currentStep = clamped;
    return this._currentStep;
  }

  next(): number {
    if (this._currentStep < this.totalSteps - 1) {
      this._currentStep++;
    }
    return this._currentStep;
  }

  prev(): number {
    if (this._currentStep > 0) {
      this._currentStep--;
    }
    return this._currentStep;
  }

  play(onTick: (step: number) => void, onComplete: () => void, intervalMs = 1000): void {
    if (this.isPlaying) return;

    if (this._currentStep >= this.totalSteps - 1) {
      this.pause();
      onComplete();
      return;
    }

    this.animationTimer = setInterval(() => {
      if (this._currentStep < this.totalSteps - 1) {
        const nextStep = this.next();
        onTick(nextStep);
      } else {
        this.pause();
        onComplete();
      }
    }, intervalMs);
  }

  pause(): void {
    if (this.animationTimer !== null) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
  }

  destroy(): void {
    this.pause();
  }

  private findDifferences(previous: unknown, current: unknown, path = '', result: string[] = []): string[] {
    if (JSON.stringify(previous) === JSON.stringify(current)) return result;
    if (result.length >= 3) return result;

    if (Array.isArray(previous) && Array.isArray(current)) {
      const length = Math.max(previous.length, current.length);
      for (let index = 0; index < length && result.length < 3; index++) {
        const nextPath = `${path}[${index}]`;
        if (index >= previous.length) result.push(`${nextPath}: added ${this.describeValue(current[index])}`);
        else if (index >= current.length) result.push(`${nextPath}: removed ${this.describeValue(previous[index])}`);
        else this.findDifferences(previous[index], current[index], nextPath, result);
      }
      return result;
    }

    if (this.isRecord(previous) && this.isRecord(current)) {
      const keys = new Set([...Object.keys(previous), ...Object.keys(current)]);
      for (const key of keys) {
        if (result.length >= 3) break;
        const nextPath = `${path}${/^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`}`;
        if (!(key in previous)) result.push(`${nextPath}: added ${this.describeValue(current[key])}`);
        else if (!(key in current)) result.push(`${nextPath}: removed ${this.describeValue(previous[key])}`);
        else this.findDifferences(previous[key], current[key], nextPath, result);
      }
      return result;
    }

    result.push(`${path || 'value'}: ${this.describeValue(previous)} → ${this.describeValue(current)}`);
    return result;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private describeValue(value: unknown): string {
    let text: string;
    try { text = typeof value === 'string' ? value : JSON.stringify(value); }
    catch { text = String(value); }
    return (text || 'undefined').length > 70 ? `${(text || '').slice(0, 67)}…` : text || 'undefined';
  }
}
