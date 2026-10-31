import { TracePlayer } from './trace-player';
import { ExecutionLogEntry } from '../../models/ExecutionLogEntry';

describe('TracePlayer', () => {
  const sampleEntries: ExecutionLogEntry[] = [
    { schema: 'av.event.v2', time: 1, type: 'array', path: 'arr', op: 'init', line: 1, value: [1, 2] },
    { schema: 'av.event.v2', time: 2, type: 'map', path: 'freq', op: 'init', line: 2, value: { 'a': 1 } },
    { schema: 'av.event.v2', time: 3, type: 'array', path: 'arr', op: 'snapshot', line: 4, value: [1, 2, 3] },
    { schema: 'av.event.v2', time: 4, type: 'map', path: 'freq', op: 'snapshot', line: 5, value: { 'a': 1, 'b': 2 } },
    { schema: 'av.event.v2', time: 5, type: 'array', path: 'arr', op: 'snapshot', line: 6, value: [1, 2, 3, 4] },
    { schema: 'av.event.v2', time: 6, type: 'map', path: 'freq', op: 'exit', line: 8, frame: 1, func: 'helper', depth: 1, value: null },
  ];

  it('separates initial entries from operations', () => {
    const player = new TracePlayer(sampleEntries);
    expect(player.initialEntries.length).toBe(2);
    expect(player.operations.length).toBe(4);
    expect(player.totalSteps).toBe(4);
    expect(player.currentStep).toBe(-1);
  });

  it('identifies all known structures and their types', () => {
    const player = new TracePlayer(sampleEntries);
    const structures = player.structures;
    expect(structures.length).toBe(2);
    expect(structures.map(s => s.path).sort()).toEqual(['arr', 'freq']);
  });

  it('retrieves structure states at initial step (-1)', () => {
    const player = new TracePlayer(sampleEntries);
    const arrState = player.stateAt(-1, 'arr');
    expect(arrState?.path).toBe('arr');
    expect(arrState?.type).toBe('array');
    expect(arrState?.value as any).toEqual([1, 2]);
    expect(arrState?.active).toBe(true);
  });

  it('retrieves structure state at intermediate and jump steps', () => {
    const player = new TracePlayer(sampleEntries);

    // At step 0: arr snapshot [1, 2, 3], freq still at init {'a': 1}
    expect(player.stateAt(0, 'arr')?.value as any).toEqual([1, 2, 3]);
    expect(player.stateAt(0, 'freq')?.value as any).toEqual({ 'a': 1 });

    // Jump directly to step 2: arr snapshot [1, 2, 3, 4], freq was updated at step 1
    expect(player.stateAt(2, 'arr')?.value as any).toEqual([1, 2, 3, 4]);
    expect(player.stateAt(2, 'freq')?.value as any).toEqual({ 'a': 1, 'b': 2 });
  });

  it('marks structure as inactive upon exit event while preserving last value', () => {
    const player = new TracePlayer(sampleEntries);

    // Step 3 is exit for freq
    const freqState = player.stateAt(3, 'freq');
    expect(freqState?.active).toBe(false);
    expect(freqState?.value as any).toEqual({ 'a': 1, 'b': 2 });
    expect(freqState?.func).toBe('helper');
  });

  it('calculates activeLine, activeEntry and activeRootPath', () => {
    const player = new TracePlayer(sampleEntries);
    player.seek(0);
    expect(player.activeLine()).toBe(4);
    expect(player.activeRootPath()).toBe('arr');
    expect(player.activeEntry()?.value as any).toEqual([1, 2, 3]);

    player.seek(1);
    expect(player.activeLine()).toBe(5);
    expect(player.activeRootPath()).toBe('freq');
  });

  it('generates meaningful change summaries', () => {
    const player = new TracePlayer(sampleEntries);

    // Step 0: arr changed from [1, 2] to [1, 2, 3] -> added 3
    const summary0 = player.changeSummaryAt(0);
    expect(summary0).toContain('added 3');

    // Step 3: freq exit
    const summary3 = player.changeSummaryAt(3);
    expect(summary3).toContain('freq: escopo encerrado (helper)');
  });

  it('navigates next, prev, and seek correctly', () => {
    const player = new TracePlayer(sampleEntries);
    expect(player.currentStep).toBe(-1);

    expect(player.next()).toBe(0);
    expect(player.next()).toBe(1);
    expect(player.prev()).toBe(0);

    expect(player.seek(3)).toBe(3);
    // Boundary check
    expect(player.seek(100)).toBe(3);
    expect(player.seek(-50)).toBe(-1);
  });

  it('computes exact changed paths between steps for diff highlighting', () => {
    const entries: ExecutionLogEntry[] = [
      { schema: 'av.event.v2', time: 1, type: 'array', path: 'arr', op: 'init', line: 1, value: [10, 20, 30] },
      { schema: 'av.event.v2', time: 2, type: 'array', path: 'arr', op: 'snapshot', line: 2, value: [10, 99, 30] },
      { schema: 'av.event.v2', time: 3, type: 'map', path: 'freq', op: 'init', line: 3, value: { 'a': 1 } },
      { schema: 'av.event.v2', time: 4, type: 'map', path: 'freq', op: 'snapshot', line: 4, value: { 'a': 1, 'b': 2 } }
    ];
    const player = new TracePlayer(entries);

    // Step 0: init arr
    const initChanged = player.changedPathsAt(0);
    expect(initChanged.has('arr')).toBeTrue();
    expect(initChanged.has('arr[0]')).toBeTrue();

    // Step 1: index 1 changed to 99
    const step1Changed = player.changedPathsAt(1);
    expect(step1Changed.has('arr[1]')).toBeTrue();
    expect(step1Changed.has('arr[0]')).toBeFalse();
    expect(step1Changed.has('arr[2]')).toBeFalse();

    // Step 3: freq key 'b' added
    const step3Changed = player.changedPathsAt(3);
    expect(step3Changed.has('freq[b]')).toBeTrue();
  });

  it('does not treat scope exit operations as changed paths', () => {
    const player = new TracePlayer(sampleEntries);
    // Step 5 in sampleEntries (which is operations index 3) is op: 'exit'
    const exitEntryIndex = sampleEntries.findIndex(e => e.op === 'exit');
    const exitChanged = player.changedPathsAt(exitEntryIndex);
    expect(exitChanged.size).toBe(0);
  });

  it('handles playback timer and completion', (done) => {
    const player = new TracePlayer(sampleEntries);
    player.seek(2); // one step before the end (totalSteps = 4, indices 0..3)

    player.play(
      (step) => {
        expect(step).toBe(3);
      },
      () => {
        expect(player.isPlaying).toBe(false);
        player.destroy();
        done();
      },
      10 // fast interval for test
    );
  });
});
