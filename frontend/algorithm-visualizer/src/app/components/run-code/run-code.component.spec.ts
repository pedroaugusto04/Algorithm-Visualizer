import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { RunCodeComponent } from './run-code.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ExecutionLogEntry } from 'src/app/models/ExecutionLogEntry';
import { DIJKSTRA_SAMPLE } from './sample-algorithms';

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

  it('preserves structure visualization and marks active false when scope exits at the end of execution', () => {
    spyOn(component['globalRenderer'], 'renderElements');
    const logs: ExecutionLogEntry[] = [
      { schema: 'av.event.v2', time: 1, type: 'array', path: 'dist', op: 'init', line: 1, value: [0, 999] },
      { schema: 'av.event.v2', time: 2, type: 'array', path: 'dist', op: 'snapshot', line: 3, value: [0, 5] },
      { schema: 'av.event.v2', time: 3, type: 'array', path: 'dist', op: 'exit', line: 10, frame: 1, func: 'main', depth: 0, value: null }
    ];

    component['processResult']({
      schema: 'av.execution.v1',
      success: true,
      stage: 'completed',
      stdout: '',
      stderr: '',
      exitCode: 0,
      durationMs: 2,
      events: logs,
      error: null
    });
    component.pause();

    // Step 0: snapshot [0, 5]
    component.goFrom0ToStep(0);
    const distStruct = component.structures.find(s => s.path === 'dist');
    expect(distStruct).toBeTruthy();
    expect(component.hasData(distStruct!)).toBe(true);
    expect(distStruct!.active).toBe(true);
    expect(distStruct!.d3Data?.arrayData).toEqual([0, 5]);

    // Step 1: exit event at the end of execution
    component.goFrom0ToStep(1);
    expect(component.hasData(distStruct!)).toBe(true);
    expect(distStruct!.initialized).toBe(true);
    expect(distStruct!.active).toBe(false);
    expect(distStruct!.d3Data?.arrayData).toEqual([0, 5]);
  });

  it('switches structure view mode to graph and immediately triggers render', () => {
    const renderSpy = spyOn(component['globalRenderer'], 'renderElements');
    const logs: ExecutionLogEntry[] = [
      { schema: 'av.event.v2', time: 1, type: 'map', path: 'adj', op: 'init', line: 1, value: { 'A': ['B'] } }
    ];

    component['processResult']({
      schema: 'av.execution.v1',
      success: true,
      stage: 'completed',
      stdout: '',
      stderr: '',
      exitCode: 0,
      durationMs: 1,
      events: logs,
      error: null
    });
    component.pause();

    const struct = component.structures.find(s => s.path === 'adj');
    expect(struct).toBeTruthy();
    expect(struct!.viewMode).toBe('map');

    renderSpy.calls.reset();
    component.changeStructureViewMode(struct!, 'graph');

    const updatedStruct = component.structures.find(s => s.path === 'adj');
    expect(updatedStruct!.viewMode).toBe('graph');
    expect(renderSpy).toHaveBeenCalled();
    expect(updatedStruct!.d3Data?.nodes.length).toBeGreaterThan(0);
  });

  describe('mobile responsive tabs and trace view', () => {
    it('initializes on the editor tab', () => {
      expect(component.mobileTab()).toBe('editor');
      expect(component.sourceEditorVisible()).toBe(true);
      expect(component.isConsoleMobileTab()).toBe(false);
    });

    it('switches between mobile tabs and syncs sourceEditorVisible', () => {
      component.setMobileTab('trace');
      expect(component.mobileTab()).toBe('trace');
      expect(component.sourceEditorVisible()).toBe(false);

      component.setMobileTab('visualizer');
      expect(component.mobileTab()).toBe('visualizer');

      component.setMobileTab('console');
      expect(component.mobileTab()).toBe('console');
      expect(component.isConsoleMobileTab()).toBe(true);

      component.setMobileTab('editor');
      expect(component.mobileTab()).toBe('editor');
      expect(component.sourceEditorVisible()).toBe(true);
    });

    it('toggles editor and trace views synchronously', () => {
      component.sourceEditorVisible.set(true);
      component.toggleSourceEditor();
      expect(component.sourceEditorVisible()).toBe(false);
      expect(component.mobileTab()).toBe('trace');

      component.toggleSourceEditor();
      expect(component.sourceEditorVisible()).toBe(true);
      expect(component.mobileTab()).toBe('editor');
    });

    it('computes activeLineText correctly from source code', () => {
      component.sourceCode.set('int a = 1;\nint b = 2;\nreturn a + b;');
      spyOn(component, 'activeLine').and.returnValue(2);
      expect(component.activeLineText()).toBe('int b = 2;');
    });

    it('switches mobile tab to visualizer on successful execution', () => {
      spyOn(component['globalRenderer'], 'renderElements');
      component.setMobileTab('editor');

      component['processResult']({
        schema: 'av.execution.v1',
        success: true,
        stage: 'completed',
        stdout: 'ok',
        stderr: '',
        exitCode: 0,
        durationMs: 5,
        events: [
          { schema: 'av.event.v2', time: 1, type: 'array', path: 'arr', op: 'init', line: 1, value: [1, 2] }
        ],
        error: null
      });

      expect(component.mobileTab()).toBe('visualizer');
    });

    it('switches mobile tab to console on execution rejection or compile error', () => {
      spyOn<any>(component['swalService'], 'errorNoButton');
      component.setMobileTab('editor');

      component['processResult']({
        schema: 'av.execution.v1',
        success: false,
        stage: 'compilation',
        stdout: '',
        stderr: 'syntax error',
        exitCode: 1,
        durationMs: 10,
        events: [],
        error: { code: 'compilation_error', message: 'Compilation failed' }
      });

      expect(component.mobileTab()).toBe('console');
    });
  });

  describe('loadSampleCode', () => {
    it('loads Dijkstra sample code and input directly when editor is empty', async () => {
      const successSpy = spyOn<any>(component['swalService'], 'successNoButton');
      component.sourceCode.set('');
      component.testCaseInput.set('');

      await component.loadSampleCode();

      expect(component.sourceCode()).toBe(DIJKSTRA_SAMPLE.sourceCode);
      expect(component.testCaseInput()).toBe(DIJKSTRA_SAMPLE.input);
      expect(component.languageControl.value).toBe(DIJKSTRA_SAMPLE.language);
      expect(successSpy).toHaveBeenCalledWith(
        'Example Loaded',
        'Dijkstra shortest path algorithm loaded. Click "Run Code" to start!'
      );
    });

    it('prompts for confirmation when editor already contains code, and cancels if rejected', async () => {
      const confirmSpy = spyOn<any>(component['swalService'], 'confirm').and.returnValue(Promise.resolve(false));
      const successSpy = spyOn<any>(component['swalService'], 'successNoButton');
      component.sourceCode.set('int main() { return 0; }');
      component.testCaseInput.set('123');

      await component.loadSampleCode();

      expect(confirmSpy).toHaveBeenCalled();
      expect(component.sourceCode()).toBe('int main() { return 0; }');
      expect(component.testCaseInput()).toBe('123');
      expect(successSpy).not.toHaveBeenCalled();
    });

    it('overwrites code when confirmation is accepted', async () => {
      spyOn<any>(component['swalService'], 'confirm').and.returnValue(Promise.resolve(true));
      const successSpy = spyOn<any>(component['swalService'], 'successNoButton');
      component.sourceCode.set('int main() { return 0; }');

      await component.loadSampleCode();

      expect(component.sourceCode()).toBe(DIJKSTRA_SAMPLE.sourceCode);
      expect(component.testCaseInput()).toBe(DIJKSTRA_SAMPLE.input);
      expect(successSpy).toHaveBeenCalled();
    });

    it('alerts if the sample code is already loaded', async () => {
      const successSpy = spyOn<any>(component['swalService'], 'successNoButton');
      component.sourceCode.set(DIJKSTRA_SAMPLE.sourceCode);
      component.testCaseInput.set(DIJKSTRA_SAMPLE.input);

      await component.loadSampleCode();

      expect(successSpy).toHaveBeenCalledWith(
        'Sample Already Loaded',
        'Dijkstra algorithm is already loaded in the editor.'
      );
    });

    it('renders the sample code help button when sourceEditorVisible is true', () => {
      component.sourceEditorVisible.set(true);
      fixture.detectChanges();

      const helpBtn = fixture.nativeElement.querySelector('.help-circle-badge');
      expect(helpBtn).toBeTruthy();
      expect(helpBtn.textContent.trim()).toBe('?');
    });
  });

  describe('Variables tab', () => {
    it('computes variableStates and displays the Variables tab when scalar variables exist', () => {
      const events: ExecutionLogEntry[] = [
        { schema: 'av.event.v2', time: 1, type: 'scalar', path: 'count', op: 'init', line: 2, func: 'main', frame: 1, value: 0 },
        { schema: 'av.event.v2', time: 2, type: 'scalar', path: 'count', op: 'snapshot', line: 3, func: 'main', frame: 1, value: 1 },
        { schema: 'av.event.v2', time: 3, type: 'scalar', path: 'count', op: 'snapshot', line: 4, func: 'main', frame: 1, value: 2 },
      ];

      component['loadEvents'](events);
      expect(component.variableStates().length).toBe(1);
      const state0 = component.variableStates()[0];
      expect(state0.path).toBe('count');
      expect(state0.value as number).toBe(0);
      expect(state0.valueType).toBe('number');
      expect(state0.scope).toBe('main() · frame 1');

      component.nextStep();
      expect(component.variableStates()[0].value as number).toBe(1);
      expect(component.variableStates()[0].changed).toBe(true);

      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Variables');
    });

    it('auto-switches to Variables tab and activates highlight when scalar changes', fakeAsync(() => {
      const events: ExecutionLogEntry[] = [
        { schema: 'av.event.v2', time: 1, type: 'array', path: 'arr', op: 'init', line: 1, func: 'main', frame: 1, value: [1, 2] },
        { schema: 'av.event.v2', time: 2, type: 'scalar', path: 'val', op: 'init', line: 2, func: 'main', frame: 1, value: 10 },
        { schema: 'av.event.v2', time: 3, type: 'array', path: 'arr', op: 'snapshot', line: 3, func: 'main', frame: 1, value: [9, 2] },
        { schema: 'av.event.v2', time: 4, type: 'scalar', path: 'val', op: 'snapshot', line: 4, func: 'main', frame: 1, value: 20 },
        { schema: 'av.event.v2', time: 5, type: 'scalar', path: 'val', op: 'snapshot', line: 5, func: 'main', frame: 1, value: 30 },
      ];

      component['loadEvents'](events);
      expect(component.structures.length).toBe(1);
      expect(component.variablesTabIndex).toBe(1);

      // Step 0 is 'arr' snapshot -> should select tab 0
      component.goToStep(0, false);
      expect(component.selectedTabIndex()).toBe(0);

      // Step 1 is 'val' snapshot -> should switch to Variables tab (index 1) and highlight
      component.goToStep(1, false);
      expect(component.selectedTabIndex()).toBe(1);
      expect(component.isVariablesTabHighlighting()).toBe(true);

      tick(1000);
      expect(component.isVariablesTabHighlighting()).toBe(false);
    }));

    it('does not auto-switch to Variables tab when autoSwitchTabs is disabled', fakeAsync(() => {
      const events: ExecutionLogEntry[] = [
        { schema: 'av.event.v2', time: 1, type: 'array', path: 'arr', op: 'init', line: 1, func: 'main', frame: 1, value: [1, 2] },
        { schema: 'av.event.v2', time: 2, type: 'scalar', path: 'val', op: 'init', line: 2, func: 'main', frame: 1, value: 10 },
        { schema: 'av.event.v2', time: 3, type: 'array', path: 'arr', op: 'snapshot', line: 3, func: 'main', frame: 1, value: [9, 2] },
        { schema: 'av.event.v2', time: 4, type: 'scalar', path: 'val', op: 'snapshot', line: 4, func: 'main', frame: 1, value: 20 },
      ];

      component['loadEvents'](events);
      component.goToStep(0, false);
      expect(component.selectedTabIndex()).toBe(0);

      component.autoSwitchTabs.set(false);
      component.goToStep(1, false);

      // Should remain on tab 0
      expect(component.selectedTabIndex()).toBe(0);
      tick(1000);
    }));
  });
});
