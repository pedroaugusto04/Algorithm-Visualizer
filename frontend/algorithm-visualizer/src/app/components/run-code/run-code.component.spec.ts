import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunCodeComponent } from './run-code.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ExecutionLogEntry } from 'src/app/models/ExecutionLogEntry';

describe('RunCodeComponent', () => {
  let component: RunCodeComponent;
  let fixture: ComponentFixture<RunCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunCodeComponent, HttpClientTestingModule],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows server errors and clears visualization when execution is rejected', () => {
    const message = 'alias de contêiner observado não suportado: values';
    const alert = spyOn<any>(component['swalService'], 'errorNoButton');
    component.totalSteps.set(4);
    component.currentStep.set(2);

    component['processResult']({
      schema: 'av.execution.v1',
      success: false,
      stage: 'instrumentation',
      stdout: '',
      stderr: '',
      exitCode: null,
      durationMs: 1,
      events: [],
      error: { code: 'instrumentation_error', message }
    });

    expect(component.executionResult()).toBe(message);
    expect(component.totalSteps()).toBe(0);
    expect(component.currentStep()).toBe(-1);
    expect(component.entries).toEqual([]);
    expect(alert).toHaveBeenCalledWith('Execution Failed', message);
  });

  it('replays corpus snapshots into the visible structures in step order', () => {
    spyOn(component['globalRenderer'], 'renderElements');
    spyOn<any>(component, 'highlightStructure');
    const logs: ExecutionLogEntry[] = [
      { schema: 'av.event.v2', time: 1, type: 'array', path: 'ways', op: 'init', line: 3, value: [[1, 0], [0, 0]] },
      { schema: 'av.event.v2', time: 2, type: 'array', path: 'ways', op: 'snapshot', line: 5, value: [[1, 1], [1, 2]] },
      { schema: 'av.event.v2', time: 3, type: 'map', path: 'frequency', op: 'init', line: 6, value: { '1': 1 } },
      { schema: 'av.event.v2', time: 4, type: 'map', path: 'frequency', op: 'snapshot', line: 8, value: { '1': 2, '2': 1 } }
    ];

    component['processResult']({
      schema: 'av.execution.v1',
      success: true,
      stage: 'completed',
      stdout: '6\n',
      stderr: '',
      exitCode: 0,
      durationMs: 4,
      events: logs,
      error: null
    });
    component.pause();
    component.goFrom0ToStep(1);

    expect(component.totalSteps()).toBe(2);
    expect(component.currentStep()).toBe(1);
    expect(component.operations.map(entry => entry.line)).toEqual([5, 8]);
    expect(component.structures.find(item => item.path === 'ways')?.d3Data?.arrayData)
      .toEqual([[1, 1], [1, 2]]);
    expect(component.structures.find(item => item.path === 'frequency')?.d3Data?.nodes.slice(1)
      .map(node => node.value)).toEqual(['1: 2', '2: 1']);
  });

  it('parses compact array format correctly', () => {
    const compactJson = JSON.stringify([1, 1, 'int main() {}', 'input42']);
    const parsed = component.parseSharedPayload(compactJson);
    expect(parsed).toEqual({
      language: 'cpp20',
      code: 'int main() {}',
      testcase: 'input42'
    });
  });

  it('parses legacy object format correctly', () => {
    const legacyJson = JSON.stringify({
      version: 1,
      language: 'cpp23',
      code: 'int x = 1;',
      testcase: ''
    });
    const parsed = component.parseSharedPayload(legacyJson);
    expect(parsed).toEqual({
      language: 'cpp23',
      code: 'int x = 1;',
      testcase: ''
    });
  });

  it('loads and runs code automatically when a valid share hash is present', async () => {
    const runSpy = spyOn(component, 'onRunCode');
    const payload = JSON.stringify([1, 0, 'int main(){return 0;}', '5']);
    const compressed = await component['compressSharePayload'](payload);
    window.location.hash = `#s=${compressed}`;

    await component['loadFromHash']();

    expect(component.sourceCode()).toBe('int main(){return 0;}');
    expect(component.testCaseInput()).toBe('5');
    expect(component.languageControl.value).toBe('cpp17');
    expect(runSpy).toHaveBeenCalled();

    window.location.hash = '';
  });
});
