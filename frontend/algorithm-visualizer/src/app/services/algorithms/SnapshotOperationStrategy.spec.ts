import { SnapshotOperationStrategy } from './SnapshotOperationStrategy';
import { StructureWindow } from 'src/app/models/StructureWindow';
import { ExecutionLogEntry } from 'src/app/models/ExecutionLogEntry';

describe('snapshot visualization contract', () => {
  let renderer: { renderElements: jasmine.Spy };
  let strategy: SnapshotOperationStrategy;

  beforeEach(() => {
    renderer = { renderElements: jasmine.createSpy('renderElements') };
    strategy = new SnapshotOperationStrategy(renderer as any);
  });

  it('replaces a sequence with the complete state from the event', () => {
    const structure: StructureWindow = {
      path: 'values',
      type: 'array',
      children: [],
      d3Data: { arrayData: [1], nodes: [], links: [], simulation: null, svg: null, width: 0, height: 0 }
    };
    const event: ExecutionLogEntry = {
      schema: 'av.event.v1',
      time: 2,
      type: 'array',
      path: 'values',
      op: 'snapshot',
      line: 12,
      value: [1, 2, 3]
    };

    strategy.execute(structure, [structure], event, true);

    expect(structure.d3Data?.arrayData).toEqual([1, 2, 3]);
    expect(renderer.renderElements).not.toHaveBeenCalled();
  });

  it('keeps repeated map keys as separate visible entries', () => {
    const structure: StructureWindow = {
      path: 'scores',
      type: 'map',
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    };
    const event: ExecutionLogEntry = {
      schema: 'av.event.v1',
      time: 2,
      type: 'map',
      path: 'scores',
      op: 'snapshot',
      line: 18,
      value: [[7, 10], [7, 20]]
    };

    strategy.execute(structure, [structure], event, true);

    const entries = structure.d3Data?.nodes.slice(1) ?? [];
    expect(entries.map(node => node.value)).toEqual(['7: 10', '7: 20']);
    expect(new Set(entries.map(node => node.id)).size).toBe(2);
    expect(structure.d3Data?.links).toHaveSize(2);
  });

  it('projects corpus event lines for nested arrays, booleans, strings, and maps', () => {
    const lines = [
      '{"schema":"av.event.v1","time":1,"type":"array","path":"ways","op":"init","line":4,"value":[[1,0],[0,0]]}',
      '{"schema":"av.event.v1","time":2,"type":"array","path":"ways","op":"snapshot","line":6,"value":[[1,1],[1,2]]}',
      '{"schema":"av.event.v1","time":3,"type":"array","path":"flags","op":"init","line":2,"value":[true,false]}',
      '{"schema":"av.event.v1","time":4,"type":"array","path":"word","op":"init","line":3,"value":["c","p","p"]}',
      '{"schema":"av.event.v1","time":5,"type":"map","path":"frequency","op":"init","line":8,"value":{"1":2,"2":1}}'
    ];
    const events = lines.map(line => JSON.parse(line) as ExecutionLogEntry);
    const structures = events.map(event => ({
      path: event.path,
      type: event.type,
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    } as StructureWindow));

    events.forEach(event => {
      const structure = structures.find(item => item.path === event.path)!;
      strategy.execute(structure, structures, event, true);
    });

    expect(structures.find(item => item.path === 'ways')?.d3Data?.arrayData).toEqual([[1, 1], [1, 2]]);
    expect(structures.find(item => item.path === 'flags')?.d3Data?.arrayData).toEqual([true, false]);
    expect(structures.find(item => item.path === 'word')?.d3Data?.arrayData).toEqual(['c', 'p', 'p']);
    expect(structures.find(item => item.path === 'frequency')?.d3Data?.nodes.slice(1).map(node => node.value))
      .toEqual(['1: 2', '2: 1']);
  });
});
