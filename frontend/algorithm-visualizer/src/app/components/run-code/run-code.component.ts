import { Component, signal, OnDestroy } from '@angular/core';
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
import { buildMapSnapshot } from 'src/app/services/renderers/map-snapshot';
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
  languageControl = new FormControl<'cpp17' | 'cpp20' | 'cpp23'>('cpp17', { nonNullable: true });

  sourceCode = signal<string>('');
  testCaseInput = signal<string>('');
  executionResult = signal<string>('');

  entries: ExecutionLogEntry[] = [];
  operations: ExecutionLogEntry[] = [];

  initialStructures: StructureWindow[] = [];
  structures: StructureWindow[] = [];
  currentStep = signal<number>(-1);
  totalSteps = signal<number>(0);
  isPlaying = signal<boolean>(false);
  animationInterval: any;
  readonly STEP_DELAY = 1000;

  private resumeTimeout: any;

  // tabs
  selectedTabIndex = signal<number>(0);
  autoSwitchTabs = signal<boolean>(true);

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

    this.resetState();
    this.executionResult.set('Compiling and running...');

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
    if (!res.success) {
      this.resetState();
      const message = [
        res.error?.message || 'The program could not be instrumented or executed.',
        res.stdout ? `[stdout]\n${res.stdout}` : '',
        res.stderr ? `[stderr]\n${res.stderr}` : ''
      ].filter(Boolean).join('\n');
      this.executionResult.set(message);
      this.swalService.errorNoButton('Execution Failed', message);
      return;
    }

    const output = [res.stdout, res.stderr ? `[stderr]\n${res.stderr}` : '']
      .filter(part => part.length > 0)
      .join('\n');
    this.executionResult.set(output || 'Code executed successfully!');
    this.entries = res.events;

    const operations: ExecutionLogEntry[] = this.entries.filter(e => e.op !== 'init');

    this.operations = operations;

    this.totalSteps.set(this.operations.length);

    this.resetStructures();
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
    const isMovingBackwards = stepIndex < this.currentStep();

    if (isMovingBackwards) {
      this.resetStructures();
      setTimeout(() => {
        this.applyOperations(0, stepIndex);
      }, 0);
      return;
    }

    setTimeout(() => {
      this.applyOperations(this.currentStep() + 1, stepIndex);
    }, 0);
  }

  goFrom0ToStep(stepIndex: number): void {
    this.applyOperations(0, stepIndex);
  }

  private applyOperations(start: number, end: number): void {
    for (let i = start; i <= end; i++) {
      const entry = this.operations[i];
      if (!entry) break;

      const rootPath = entry.path.split('[')[0];
      const structIndex = this.structures.findIndex(s => s.path === rootPath);
      const rootStructure = this.structures.find(s => s.path === rootPath);

      if (rootStructure) {

        rootStructure.initialized = true;

        console.log(entry.op, entry.path, entry.time, entry.type, entry.value, rootStructure.path);

        this.highlightStructure(rootStructure, structIndex);

        const strategy = this.operationFactory.getStrategy(rootStructure.type, rootStructure.viewMode || "", entry.op);
        if (strategy) {
          const isLastStepOfJump = (i === end);
          strategy.execute(rootStructure, this.structures, entry, !isLastStepOfJump);
        }
      }
      this.currentStep.set(i);
    }
  }

  private resetState(): void {
    this.pause();
    this.entries = [];
    this.operations = [];
    this.resetStructures(true);
    this.resetView();
    this.currentStep.set(-1);
    this.totalSteps.set(0);
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

    this.entries.filter(e => e.op === 'init').forEach(entry => {
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
          const snapshot = buildMapSnapshot(entry.path, entry.value, width, height);
          d3Data.nodes = snapshot.nodes;
          d3Data.links = snapshot.links;
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

    if (this.autoSwitchTabs()) {
      this.selectedTabIndex.set(tabIndex);
    }

    setTimeout(() => {
      struct.isHighlighting = true;

      setTimeout(() => {
        struct.isHighlighting = false;
      }, this.STEP_DELAY - 50);
    }, 10);
  }

  setTabManully(event: any) {
    if (this.autoSwitchTabs()) {
      this.autoSwitchTabs.set(false);
    }
  }

  changeStructureViewMode(
    struct: StructureWindow,
    newMode: 'map' | 'graph'
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
