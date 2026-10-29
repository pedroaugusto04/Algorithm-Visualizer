import { Component, computed, signal, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CodeService } from 'src/app/services/code.service';
import { ExecuteCodeResponse } from 'src/app/models/Responses/ExecuteCodeResponse';
import { ExecutionLogEntry } from 'src/app/models/ExecutionLogEntry';
import { StructureWindow } from 'src/app/models/StructureWindow';
import { AlgorithmOperationFactory } from 'src/app/services/algorithms/AlgorithmOperationFactory';
import { AlgorithmUtilsService } from 'src/app/services/utils/algorithms/algorithm-utils.service';
import { StructureVisualizerComponent } from '../app-structure-visualizer/app-structure-visualizer.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GlobalRenderer } from 'src/app/services/renderers/GlobalRenderer';
import { buildMapGraphSnapshot, buildMapSnapshot } from 'src/app/services/renderers/map-snapshot';
import { SwalService } from 'src/app/services/utils/swal/swal.service';

@Component({
  selector: 'app-run-code',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatButtonToggleModule,
    StructureVisualizerComponent,
    MatSlideToggleModule,
  ],
  templateUrl: './run-code.component.html',
  styleUrls: ['./run-code.component.scss']
})
export class RunCodeComponent implements OnDestroy {
  @ViewChild('sourceLinesContainer')
  set sourceLinesContainerRef(ref: ElementRef<HTMLDivElement> | undefined) {
    this.sourceScrollContainer = ref?.nativeElement;
    if (ref) this.scrollActiveSourceLine();
  }

  languageControl = new FormControl<'cpp17' | 'cpp20' | 'cpp23'>('cpp17', { nonNullable: true });

  sourceCode = signal<string>('');
  sourceLineList = computed(() => this.sourceCode().split('\n'));
  testCaseInput = signal<string>('');
  executionResult = signal<string>('');
  executionWarnings = signal<string[]>([]);
  isTraceTruncated = signal<boolean>(false);

  entries: ExecutionLogEntry[] = [];
  private initialEntries: ExecutionLogEntry[] = [];
  operations: ExecutionLogEntry[] = [];
  private operationIndicesByPath = new Map<string, number[]>();

  initialStructures: StructureWindow[] = [];
  structures: StructureWindow[] = [];
  currentStep = signal<number>(-1);
  totalSteps = signal<number>(0);
  isPlaying = signal<boolean>(false);
  animationInterval: any;
  readonly STEP_DELAY = 1000;

  private resumeTimeout: any;
  private sourceScrollContainer?: HTMLDivElement;
  private tabSelectionVersion = 0;
  private autoSwitchTargetIndex: number | null = null;

  // tabs
  selectedTabIndex = signal<number>(0);
  autoSwitchTabs = signal<boolean>(true);
  executionStarted = signal<boolean>(false);
  executionSettingsVisible = signal<boolean>(true);

  constructor(
    private codeService: CodeService,
    private operationFactory: AlgorithmOperationFactory,
    private algorithmUtilsService: AlgorithmUtilsService,
    private swalService: SwalService,
    private globalRenderer: GlobalRenderer
  ) { }

  onRunCode(): void {
    if (!this.sourceCode() || !this.languageControl.value) {
      this.executionResult.set('Error: Code and language are required.');
      return;
    }

    this.executionStarted.set(true);
    this.executionSettingsVisible.set(false);
    this.resetState();
    this.executionResult.set('Compiling and running...');
    this.executionWarnings.set([]);
    this.isTraceTruncated.set(false);

    const payload = {
      language: this.languageControl.value,
      code: this.sourceCode(),
      testcase: this.testCaseInput()
    };

    // Competitive programming programs consume stdin through their own main().
    this.codeService.executeCode(payload).subscribe({
      next: (res: ExecuteCodeResponse) => {
        this.processResult(res);
      },
      error: (error) => {
        this.executionResult.set(`Execution failed: ${error.message || "Provided code is not supported"}`);
        this.swalService.errorNoButton("Execution Failed","The provided code is not yet supported.");
      }
    })
  }

  private processResult(res: ExecuteCodeResponse) {
    const warnings = res.warnings ?? [];
    const truncated = res.truncated ?? false;

    if (!res.success) {
      // On crash/timeout we may have a partial trace — show it before surfacing the error.
      if (truncated && res.events.length > 0) {
        this.isTraceTruncated.set(true);
        this.executionWarnings.set(warnings);
        this.loadEvents(res.events);
      } else {
        this.resetState();
      }
      const message = [
        res.error?.message || 'The program could not be instrumented or executed.',
        res.stdout ? `[stdout]\n${res.stdout}` : '',
        res.stderr ? `[stderr]\n${res.stderr}` : ''
      ].filter(Boolean).join('\n');
      this.executionResult.set(message);
      if (!truncated || res.events.length === 0) {
        this.swalService.errorNoButton('Execution Failed', message);
      }
      return;
    }

    const output = [res.stdout, res.stderr ? `[stderr]\n${res.stderr}` : '']
      .filter(part => part.length > 0)
      .join('\n');
    this.executionResult.set(output || 'Code executed successfully!');
    this.isTraceTruncated.set(truncated);
    this.executionWarnings.set(warnings);
    this.loadEvents(res.events);
  }

  private loadEvents(allEvents: ExecutionLogEntry[]): void {
    this.entries = allEvents;
    this.initialEntries = allEvents.filter(e => e.op === 'init');
    this.operations = allEvents.filter(e => e.op !== 'init');
    this.operationIndicesByPath.clear();
    this.operations.forEach((entry, index) => {
      const rootPath = entry.path.split('[')[0];
      const indices = this.operationIndicesByPath.get(rootPath) ?? [];
      indices.push(index);
      this.operationIndicesByPath.set(rootPath, indices);
    });
    this.totalSteps.set(this.operations.length);

    this.resetStructures();
    const firstRootPath = this.operations[0]?.path.split('[')[0];
    const firstStructureIndex = this.structures.findIndex(s => s.path === firstRootPath);
    if (firstStructureIndex >= 0) this.selectStructureTab(firstStructureIndex);
    else if (this.autoSwitchTabs()) this.showOutputConsole();
    this.play();
  }

  private play(): void {
    if (this.isPlaying()) return;

    this.globalRenderer.renderElements(this.structures);

    if (this.currentStep() >= this.totalSteps() - 1) {
      this.pause();
      return;
    }

    this.isPlaying.set(true);
    this.animationInterval = setInterval(() => {
      if (this.currentStep() < this.totalSteps() - 1) {
        this.nextStep(false);
      } else {
        this.pause();
        this.showOutputConsole();
      }
    }, this.STEP_DELAY);
  }

  togglePlay(): void {
    this.isPlaying() ? this.pause() : this.play();
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.animationInterval) clearInterval(this.animationInterval);
  }

  nextStep(isManual: boolean = true): void {
    if (isManual) {
      this.pause();
      if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    }

    if (this.currentStep() < this.totalSteps() - 1) {
      const nextIdx = this.currentStep() + 1;
      this.goToStep(nextIdx);
    }

    if (isManual) {
      this.resumeTimeout = setTimeout(() => {
        if (this.currentStep() < this.totalSteps() - 1) {
          this.play();
        }
      }, 1000);
    }
  }

  prevStep(isManual: boolean = true): void {
    if (isManual) {
      this.pause();
      if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    }

    if (this.currentStep() > 0) {
      const prevIdx = this.currentStep() - 1;
      this.goToStep(prevIdx);
    }

    if (isManual) {
      this.resumeTimeout = setTimeout(() => {
        if (this.currentStep() < this.totalSteps() - 1) {
          this.play();
        }
      }, 1000);
    }

  }

  goToStep(stepIndex: number): void {
    setTimeout(() => {
      this.resetStructures();
      this.applyOperations(0, stepIndex);
      this.globalRenderer.renderElements(this.structures);
    }, 0);
  }

  goFrom0ToStep(stepIndex: number): void {
    this.applyOperations(0, stepIndex);
  }

  private applyOperations(start: number, end: number): void {
    if (start === 0 && end >= 0) {
      for (const [rootPath, indices] of this.operationIndicesByPath) {
        let low = 0;
        let high = indices.length - 1;
        let match = -1;
        while (low <= high) {
          const middle = (low + high) >> 1;
          if (indices[middle] <= end) {
            match = indices[middle];
            low = middle + 1;
          } else {
            high = middle - 1;
          }
        }
        if (match < 0) continue;
        const entry = this.operations[match];
        const structureIndex = this.structures.findIndex(item => item.path === rootPath);
        const structure = this.structures[structureIndex];
        if (!structure) continue;
        structure.initialized = true;
        this.operationFactory.getStrategy(structure.type, structure.viewMode || '', entry.op)
          ?.execute(structure, this.structures, entry, true);
      }
      this.currentStep.set(end);
      const activeRoot = this.operations[end]?.path.split('[')[0];
      const activeStructureIndex = this.structures.findIndex(item => item.path === activeRoot);
      if (activeStructureIndex >= 0 && end < this.totalSteps() - 1) {
        this.highlightStructure(this.structures[activeStructureIndex], activeStructureIndex);
      }
      this.scrollActiveSourceLine();
      if (end === this.totalSteps() - 1) this.showOutputConsole();
      return;
    }

    for (let i = start; i <= end; i++) {
      const entry = this.operations[i];
      if (!entry) break;

      const rootPath = entry.path.split('[')[0];
      const structIndex = this.structures.findIndex(s => s.path === rootPath);
      const rootStructure = this.structures.find(s => s.path === rootPath);

      if (rootStructure) {
        rootStructure.initialized = true;
        this.highlightStructure(rootStructure, structIndex);

        const strategy = this.operationFactory.getStrategy(rootStructure.type, rootStructure.viewMode || "", entry.op);
        if (strategy) {
          const isLastStepOfJump = (i === end);
          strategy.execute(rootStructure, this.structures, entry, !isLastStepOfJump);
        }
      }
      this.currentStep.set(i);
      this.scrollActiveSourceLine();
    }
    if (end === this.totalSteps() - 1) this.showOutputConsole();
  }

  private showOutputConsole(): void {
    this.tabSelectionVersion++;
    this.autoSwitchTargetIndex = this.structures.length;
    this.selectedTabIndex.set(this.autoSwitchTargetIndex);
  }

  private selectStructureTab(tabIndex: number): void {
    if (!this.autoSwitchTabs() || tabIndex < 0) return;
    const version = ++this.tabSelectionVersion;
    this.autoSwitchTargetIndex = tabIndex;
    this.selectedTabIndex.set(tabIndex);
    requestAnimationFrame(() => {
      if (version === this.tabSelectionVersion && this.autoSwitchTabs() && this.structures[tabIndex]) {
        this.selectedTabIndex.set(tabIndex);
      }
    });
  }

  onSelectedTabChange(index: number): void {
    if (this.autoSwitchTabs() && this.autoSwitchTargetIndex !== null && index !== this.autoSwitchTargetIndex) return;
    this.selectedTabIndex.set(index);
  }

  private scrollActiveSourceLine(): void {
    const line = this.activeLine();
    if (line === null || !this.sourceScrollContainer) return;

    requestAnimationFrame(() => {
      const container = this.sourceScrollContainer;
      const row = container?.querySelector<HTMLElement>(`[data-source-line="${line}"]`);
      if (!container || !row) return;
      const containerBounds = container.getBoundingClientRect();
      const rowBounds = row.getBoundingClientRect();
      if (rowBounds.top < containerBounds.top) {
        container.scrollTo({ top: container.scrollTop - (containerBounds.top - rowBounds.top), behavior: 'smooth' });
      } else if (rowBounds.bottom > containerBounds.bottom) {
        container.scrollTo({ top: container.scrollTop + (rowBounds.bottom - containerBounds.bottom), behavior: 'smooth' });
      }
    });
  }

  activeLine(): number | null {
    return this.currentStep() >= 0 ? this.operations[this.currentStep()]?.line ?? null : null;
  }

  currentChangeSummary(): string {
    const entry = this.operations[this.currentStep()];
    if (!entry) return 'Execute the program to inspect its changes.';
    const rootPath = entry.path.split('[')[0];
    const indices = this.operationIndicesByPath.get(rootPath) ?? [];
    let previousIndex: number | undefined;
    for (const index of indices) {
      if (index >= this.currentStep()) break;
      previousIndex = index;
    }
    const initial = this.initialEntries.find(item => item.path.split('[')[0] === rootPath)?.value;
    const previous = previousIndex === undefined ? initial : this.operations[previousIndex].value;
    if (previous === undefined) return `${entry.path}: initialized as ${this.describeValue(entry.value)}`;
    const differences = this.findDifferences(previous, entry.value);
    if (differences.length === 0) return `${entry.path}: value updated`;
    const suffix = differences.length > 2 ? ` (+${differences.length - 2} more)` : '';
    const formatted = differences.slice(0, 2).map(difference =>
      difference.startsWith('[') || difference.startsWith('.') ? `${rootPath}${difference}` : difference);
    return `${formatted.join(' · ')}${suffix}`;
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

  private resetState(): void {
    this.pause();
    this.entries = [];
    this.initialEntries = [];
    this.operations = [];
    this.operationIndicesByPath.clear();
    this.resetStructures(true);
    this.resetView();
    this.currentStep.set(-1);
    this.totalSteps.set(0);
    this.autoSwitchTargetIndex = null;
    this.tabSelectionVersion++;
    this.selectedTabIndex.set(0);
    this.executionWarnings.set([]);
    this.isTraceTruncated.set(false);
  }

  showExecutionSettings(): void {
    this.executionSettingsVisible.set(true);
  }

  private resetStructures(resetInitialized: boolean = false) {

    this.structures.forEach(s => {
      if (s.d3Data) {
        if (resetInitialized) {
          s.initialized = false;
        }
        if (s.d3Data.simulation) s.d3Data.simulation.stop();
        if (s.d3Data.svg) s.d3Data.svg.selectAll('*').remove();

        s.d3Data.nodes.length = 0;
        s.d3Data.links.length = 0;
        s.d3Data.arrayData = [];
      }
    });

    this.initialEntries.forEach(entry => {
      const struct = this.algorithmUtilsService.getOrCreateStructure(this.structures, entry.path, entry.type);
      if (struct && struct.d3Data) {
        const d3Data = struct.d3Data;
        if (struct.type === 'array') {
          if (Array.isArray(entry.value)) {
            d3Data.arrayData = JSON.parse(JSON.stringify(entry.value));
          } else {
            d3Data.arrayData = entry.value !== undefined ? [entry.value] : [];
          }
        } else if (struct.type === 'map') {
          const width = d3Data.width || 800;
          const height = d3Data.height || 600;
          const snapshot = struct.viewMode === 'graph'
            ? buildMapGraphSnapshot(entry.path, entry.value, width, height)
            : buildMapSnapshot(entry.path, entry.value, width, height);
          d3Data.nodes = snapshot.nodes;
          d3Data.links = snapshot.links;
          d3Data.mapEntries = snapshot.entries;
        }
      }
    });

    this.currentStep.set(-1);
  }

  private resetView() {
    this.entries = [];
    this.operations = [];
    this.initialStructures = [];
    this.structures = [];
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    let text = event.clipboardData?.getData('text') ?? '';

    text = text
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"');

    this.sourceCode.set(text);
  }

  onSliderInput(stepIndex: number): void {
    this.pause();
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);

    this.goToStep(stepIndex);
  }

  onSliderChange(): void {
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);

    this.resumeTimeout = setTimeout(() => {
      if (this.currentStep() < this.totalSteps() - 1) {
        this.play();
      }
    }, 1000);
  }

  hasData(struct: StructureWindow): boolean {
    return (struct.initialized ?? false);
  }

  highlightStructure(struct: StructureWindow, tabIndex: number) {
    struct.isHighlighting = true;

    this.selectStructureTab(tabIndex);

    setTimeout(() => {
      struct.isHighlighting = true;

      setTimeout(() => {
        struct.isHighlighting = false;
      }, this.STEP_DELAY - 50);
    }, 10);
  }

  changeStructureViewMode(
    struct: StructureWindow,
    newMode: 'map' | 'graph' | 'array' | 'queue' | 'stack'
  ): void {

    if (struct.viewMode === newMode) return;

    struct.viewMode = newMode;

    if (struct.initialized) {
      const current = this.currentStep();

      this.resetStructures();

      setTimeout(() => {
        if (current >= 0) {
          this.goFrom0ToStep(current);
          this.globalRenderer.renderElements(this.structures);
        }
      }, 0);
    }
  }


  ngOnDestroy(): void {
    this.resetState();
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
  }

}
