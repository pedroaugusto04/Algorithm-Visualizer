import { Component, signal, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { CodeService } from 'src/app/services/code.service';
import { ExecuteCodeResponse } from 'src/app/models/Responses/ExecuteCodeResponse';
import { ExecutionLogEntry } from 'src/app/models/ExecutionLogEntry';
import { StructureWindow } from 'src/app/models/StructureWindow';
import { AlgorithmOperationFactory } from 'src/app/services/algorithms/AlgorithmOperationFactory';
import { AlgorithmUtilsService } from 'src/app/services/utils/algorithms/algorithm-utils.service';
import { StructureVisualizerComponent } from '../app-structure-visualizer/app-structure-visualizer.component';

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
    StructureVisualizerComponent
  ],
  templateUrl: './run-code.component.html',
  styleUrls: ['./run-code.component.scss']
})
export class RunCodeComponent implements OnDestroy {
  languageControl = new FormControl('cpp17');
  platformControl = new FormControl('leetcode');

  sourceCode = signal<string>('');
  testCaseInput = signal<string>('');
  selectedFileName = signal<string | null>(null);
  executionResult = signal<string>('');

  entries: ExecutionLogEntry[] = [];
  operations: ExecutionLogEntry[] = [];

  initialStructures: StructureWindow[] = [];
  structures: StructureWindow[] = [];
  currentStep = signal<number>(0);
  totalSteps = signal<number>(0);
  isPlaying = signal<boolean>(false);
  animationInterval: any;
  readonly STEP_DELAY = 700;

  constructor(
    private codeService: CodeService,
    private operationFactory: AlgorithmOperationFactory,
    private algorithmUtilsService: AlgorithmUtilsService
  ) { }

  onRunCode(): void {
    if (!this.sourceCode() || !this.languageControl.value) {
      this.executionResult.set('Error: Code and language are required.');
      return;
    }

    this.resetState();
    this.executionResult.set('Compiling and running...');

    const executeCodeDTO = {
      language: this.languageControl.value,
      code: this.sourceCode().trimEnd()
    };

    this.codeService.executeCode(executeCodeDTO).subscribe({
      next: (res: ExecuteCodeResponse) => {
        if (res.success) {
          this.executionResult.set(res.systemLogs || 'Success!');

          const entries: ExecutionLogEntry[] = res.executionLogs
            .trim()
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => JSON.parse(line));

          this.entries = entries;

          const operations: ExecutionLogEntry[] = entries.filter(e => e.op !== 'init');

          this.operations = operations;

          this.totalSteps.set(this.operations.length);

          this.resetStructures();
          this.play();

        } else {
          this.executionResult.set(`Error: ${res.error}`);
        }
      },
      error: (err) => {
        console.error(err);
        this.executionResult.set('Execution failed. Check your connection.');
      }
    });
  }


  private play(): void {
    if (this.isPlaying()) return;

    if (this.currentStep() >= this.totalSteps() - 1) {
      this.pause();
      return;
    }

    this.isPlaying.set(true);
    this.animationInterval = setInterval(() => {
      if (this.currentStep() < this.totalSteps() - 1) {
        this.nextStep();
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

  nextStep(): void {
    if (this.currentStep() < this.totalSteps() - 1) {
      const nextIdx = this.currentStep() + 1;
      this.goToStep(nextIdx);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.goToStep(this.currentStep() - 1);
    }
  }

  goToStep(stepIndex: number): void {
    const isMovingBackwards = stepIndex < this.currentStep();

    this.pause();

    if (isMovingBackwards) {
      this.resetStructures();
      setTimeout(() => {
        this.applyOperations(0, stepIndex);
      }, 0);
      this.play();
      return;
    }
    
    setTimeout(() => {
      this.applyOperations(this.currentStep() + 1, stepIndex);
    }, 0);
    this.play();
  }

  goFrom0ToStep(stepIndex: number): void {
    this.applyOperations(0, stepIndex);
  }

  private applyOperations(start: number, end: number): void {
    for (let i = start; i <= end; i++) {
      const entry = this.operations[i];
      if (!entry) break;

      const rootPath = entry.path.split('[')[0];
      const rootStructure = this.structures.find(s => s.path === rootPath);

      if (rootStructure) {
        const strategy = this.operationFactory.getStrategy(rootStructure.type, entry.op);
        if (strategy) {
          const isLastStepOfJump = (i === end);
          strategy.execute(rootStructure, entry, !isLastStepOfJump);
        }
      }
      this.currentStep.set(i);
    }
  }

  private resetState(): void {
    this.pause();
    this.resetStructures();
    this.currentStep.set(0);
    this.totalSteps.set(0);
  }

  private resetStructures() {

    this.structures = [];

    this.entries.filter(e => e.op === 'init').forEach(entry => {
      this.algorithmUtilsService.getOrCreateStructure(this.structures, entry.path, entry.type);
    });

    this.currentStep.set(0);
  }

  ngOnDestroy(): void {
    this.resetState();
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    if (element.files?.length) this.selectedFileName.set(element.files[0].name);
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text').replace(/\\n/g, '\n');
    if (text) this.sourceCode.set(text);
  }

}