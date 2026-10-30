import { Component, computed, signal, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CodeService } from 'src/app/services/code.service';
import { ExecuteCodeResponse } from 'src/app/models/Responses/ExecuteCodeResponse';
import { ExecutionLogEntry } from 'src/app/models/ExecutionLogEntry';
import { StructureWindow, createStructureWindow } from 'src/app/models/StructureWindow';
import { StructureVisualizerComponent } from '../app-structure-visualizer/app-structure-visualizer.component';
import { GlobalRenderer } from 'src/app/services/renderers/GlobalRenderer';
import { applySnapshotToStructure } from 'src/app/services/renderers/view-model-builder';
import { SwalService } from 'src/app/services/utils/swal/swal.service';
import { TracePlayer } from 'src/app/services/trace/trace-player';

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
  testCaseLineList = computed(() => this.testCaseInput().split('\n'));
  sourceEditorScrollTop = signal<number>(0);
  stdinEditorScrollTop = signal<number>(0);
  executionResult = signal<string>('');
  executionWarnings = signal<string[]>([]);
  isTraceTruncated = signal<boolean>(false);

  entries: ExecutionLogEntry[] = [];
  player: TracePlayer | null = null;
  get operations(): ExecutionLogEntry[] {
    return this.player ? (this.player.operations as ExecutionLogEntry[]) : [];
  }

  structures: StructureWindow[] = [];
  currentStep = signal<number>(-1);
  totalSteps = signal<number>(0);
  isPlaying = signal<boolean>(false);
  playbackSpeed = signal<number>(1);
  private traceRevision = signal<number>(0);
  readonly BASE_STEP_DELAY = 1000;

  variableStates = computed(() => {
    this.traceRevision();
    const player = this.player;
    if (!player) return [];

    const step = this.currentStep();
    const changedPaths = player.changedPathsAt(player.entryIndexForStep(step));
    return player.structures
      .filter(variable => variable.type === 'scalar')
      .map(variable => {
        const state = player.stateAt(step, variable.path);
        return state?.active ? {
          path: variable.path,
          value: state.value,
          valueType: state.value === null ? 'null' : typeof state.value,
          scope: state.func ? `${state.func}() · frame ${state.frame ?? 0}` : 'Global',
          changed: changedPaths.has(variable.path),
        } : null;
      })
      .filter((state): state is NonNullable<typeof state> => state !== null);
  });

  get stepDelay(): number {
    return Math.round(this.BASE_STEP_DELAY / (this.playbackSpeed() || 1));
  }

  currentCallStack = computed(() => {
    const step = this.currentStep();
    if (step < 0 || !this.player) return null;
    const entry = this.player.activeEntry(step);
    if (!entry || !entry.func) return null;
    return {
      func: entry.func,
      depth: entry.depth ?? 0,
      frame: entry.frame ?? 0,
    };
  });

  private resumeTimeout: any;
  private sourceScrollContainer?: HTMLDivElement;
  private tabSelectionVersion = 0;
  private autoSwitchTargetIndex: number | null = null;

  // tabs
  selectedTabIndex = signal<number>(0);
  autoSwitchTabs = signal<boolean>(true);
  executionStarted = signal<boolean>(false);
  sourceEditorVisible = signal<boolean>(true);
  outputConsoleExpanded = signal<boolean>(false);

  constructor(
    private codeService: CodeService,
    private swalService: SwalService,
    private globalRenderer: GlobalRenderer
  ) { }

  onRunCode(): void {
    if (!this.sourceCode() || !this.languageControl.value) {
      this.executionResult.set('Error: Code and language are required.');
      return;
    }

    this.executionStarted.set(true);
    this.sourceEditorVisible.set(false);
    this.outputConsoleExpanded.set(false);
    this.resetState();
    this.executionResult.set('Compiling and running...');
    this.executionWarnings.set([]);
    this.isTraceTruncated.set(false);

    const payload = {
      language: this.languageControl.value,
      code: this.sourceCode(),
      testcase: this.testCaseInput()
    };

    this.codeService.executeCode(payload).subscribe({
      next: (res: ExecuteCodeResponse) => {
        this.processResult(res);
      },
      error: (error) => {
        this.executionResult.set(`Execution failed: ${error.message || "Provided code is not supported"}`);
        this.swalService.errorNoButton("Execution Failed", "The provided code is not yet supported.");
      }
    });
  }

  private processResult(res: ExecuteCodeResponse): void {
    const warnings = res.warnings ?? [];
    const truncated = res.truncated ?? false;

    if (!res.success) {
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
    this.player = new TracePlayer(allEvents);
    this.traceRevision.update(revision => revision + 1);
    this.totalSteps.set(this.player.totalSteps);

    this.structures = [];
    for (const known of this.player.structures) {
      if (known.type === 'scalar') continue;
      const struct = createStructureWindow(known.path, known.type);
      applySnapshotToStructure(struct, known.initialValue, struct.viewMode);
      this.structures.push(struct);
    }

    const firstRoot = this.player.activeRootPath(0);
    const firstStructureIndex = firstRoot ? this.structures.findIndex(s => s.path === firstRoot) : -1;
    if (firstStructureIndex >= 0) {
      this.selectStructureTab(firstStructureIndex);
    }

    this.play();
  }

  play(): void {
    if (this.isPlaying()) return;
    this.globalRenderer.renderElements(this.structures);

    if (this.currentStep() >= this.totalSteps() - 1) {
      this.pause();
      return;
    }

    this.isPlaying.set(true);
    this.player?.play(
      (step) => {
        this.goToStep(step, false);
      },
      () => {
        this.pause();
      },
      this.stepDelay
    );
  }

  setPlaybackSpeed(speed: number): void {
    if (!speed || speed <= 0) return;
    this.playbackSpeed.set(speed);
    if (this.isPlaying()) {
      this.pause();
      this.play();
    }
  }

  togglePlay(): void {
    this.isPlaying() ? this.pause() : this.play();
  }

  pause(): void {
    this.isPlaying.set(false);
    this.player?.pause();
  }

  nextStep(isManual = true): void {
    if (!this.player) return;
    if (isManual) {
      this.pause();
      if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    }

    if (this.currentStep() < this.totalSteps() - 1) {
      this.goToStep(this.currentStep() + 1, false);
    }
  }

  prevStep(isManual = true): void {
    if (!this.player) return;
    if (isManual) {
      this.pause();
      if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    }

    if (this.currentStep() > 0) {
      this.goToStep(this.currentStep() - 1, false);
    }
  }

  goToStep(stepIndex: number, isManual = true): void {
    if (!this.player) return;
    if (isManual) {
      this.pause();
      if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    }

    this.player.seek(stepIndex);
    this.currentStep.set(this.player.currentStep);
    this.traceRevision.update(revision => revision + 1);
    this.syncStructuresToStep(this.player.currentStep);
    this.scrollActiveSourceLine();

    const activeRoot = this.player.activeRootPath(this.player.currentStep);
    const activeStructureIndex = activeRoot ? this.structures.findIndex(s => s.path === activeRoot) : -1;
    if (activeStructureIndex >= 0 && this.player.currentStep < this.totalSteps() - 1) {
      this.highlightStructure(this.structures[activeStructureIndex], activeStructureIndex);
    }
  }

  goFrom0ToStep(stepIndex: number): void {
    this.goToStep(stepIndex, false);
  }

  private syncStructuresToStep(step: number): void {
    if (!this.player) return;
    const states = this.player.allStatesAt(step);
    const changedPaths = this.player.changedPathsAt(this.player.entryIndexForStep(step));
    for (const struct of this.structures) {
      const state = states.get(struct.path);
      if (state) {
        struct.initialized = state.active;
        applySnapshotToStructure(struct, state.value, struct.viewMode);
      }
      if (struct.d3Data) {
        struct.d3Data.ownerPath = struct.path;
        struct.d3Data.changedPaths = changedPaths;
      }
    }
    this.globalRenderer.renderElements(this.structures);
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
    return this.player?.activeLine(this.currentStep()) ?? null;
  }

  currentChangeSummary(): string {
    return this.player?.changeSummaryAt(this.currentStep()) ?? 'Execute the program to inspect its changes.';
  }

  private resetState(): void {
    this.pause();
    this.entries = [];
    this.player = null;
    this.traceRevision.update(revision => revision + 1);
    this.structures = [];
    this.currentStep.set(-1);
    this.totalSteps.set(0);
    this.autoSwitchTargetIndex = null;
    this.tabSelectionVersion++;
    this.selectedTabIndex.set(0);
    this.executionWarnings.set([]);
    this.isTraceTruncated.set(false);
  }

  formatVariableValue(value: unknown): string {
    if (typeof value === 'string') return JSON.stringify(value);
    if (value === undefined) return 'undefined';
    return String(value);
  }

  syncEditorLineNumbers(event: Event, editor: 'source' | 'stdin'): void {
    const scrollTop = (event.target as HTMLTextAreaElement).scrollTop;
    if (editor === 'source') this.sourceEditorScrollTop.set(scrollTop);
    else this.stdinEditorScrollTop.set(scrollTop);
  }

  toggleSourceEditor(): void {
    this.sourceEditorVisible.update(visible => !visible);
  }

  toggleOutputConsole(): void {
    this.outputConsoleExpanded.update(expanded => !expanded);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.totalSteps() <= 0) return;

    // Do not intercept if user is typing in an input or textarea
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      this.togglePlay();
    } else if (event.code === 'ArrowRight') {
      event.preventDefault();
      this.nextStep();
    } else if (event.code === 'ArrowLeft') {
      event.preventDefault();
      this.prevStep();
    }
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
    return struct.initialized ?? false;
  }

  highlightStructure(struct: StructureWindow, tabIndex: number): void {
    struct.isHighlighting = true;
    this.selectStructureTab(tabIndex);

    setTimeout(() => {
      struct.isHighlighting = true;
      setTimeout(() => {
        struct.isHighlighting = false;
      }, Math.max(50, this.stepDelay - 50));
    }, 10);
  }

  changeStructureViewMode(
    struct: StructureWindow,
    newMode: 'map' | 'graph' | 'array' | 'queue' | 'stack'
  ): void {
    if (struct.viewMode === newMode) return;
    struct.viewMode = newMode;
    if (struct.initialized && this.player) {
      this.syncStructuresToStep(this.currentStep());
    }
  }

  ngOnDestroy(): void {
    this.resetState();
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
  }
}
