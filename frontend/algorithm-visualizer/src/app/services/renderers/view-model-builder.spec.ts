import { applySnapshotToStructure } from './view-model-builder';
import { StructureWindow } from '../../models/StructureWindow';
import { JsonValue } from '../../models/ExecutionLogEntry';

describe('view-model-builder', () => {
  it('replaces an array structure with serialized array data', () => {
    const structure: StructureWindow = {
      path: 'values',
      type: 'array',
      children: [],
      d3Data: { arrayData: [1], nodes: [], links: [], simulation: null, svg: null, width: 0, height: 0 }
    };

    applySnapshotToStructure(structure, [1, 2, 3]);

    expect(structure.d3Data?.arrayData).toEqual([1, 2, 3]);
  });

  it('keeps repeated map keys as separate visible entries in default map view', () => {
    const structure: StructureWindow = {
      path: 'scores',
      type: 'map',
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    };
    const value: JsonValue = [[7, 10], [7, 20]];

    applySnapshotToStructure(structure, value);

    const entries = structure.d3Data?.nodes.slice(1) ?? [];
    expect(entries.map(node => node.value)).toEqual(['7: 10', '7: 20']);
    expect(new Set(entries.map(node => node.id)).size).toBe(2);
    expect(structure.d3Data?.links).toHaveSize(2);
    expect(structure.d3Data?.mapEntries).toEqual([
      { key: '7', value: 10, path: 'scores[7]' },
      { key: '7', value: 20, path: 'scores[7]' }
    ]);
  });

  it('projects corpus event lines for nested arrays, booleans, strings, and maps', () => {
    const ways: StructureWindow = {
      path: 'ways',
      type: 'array',
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    };
    const flags: StructureWindow = {
      path: 'flags',
      type: 'array',
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    };
    const word: StructureWindow = {
      path: 'word',
      type: 'array',
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    };
    const frequency: StructureWindow = {
      path: 'frequency',
      type: 'map',
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    };

    applySnapshotToStructure(ways, [[1, 1], [1, 2]]);
    applySnapshotToStructure(flags, [true, false]);
    applySnapshotToStructure(word, ['c', 'p', 'p']);
    applySnapshotToStructure(frequency, { '1': 2, '2': 1 });

    expect(ways.d3Data?.arrayData).toEqual([[1, 1], [1, 2]]);
    expect(flags.d3Data?.arrayData).toEqual([true, false]);
    expect(word.d3Data?.arrayData).toEqual(['c', 'p', 'p']);
    expect(frequency.d3Data?.nodes.slice(1).map(node => node.value)).toEqual(['1: 2', '2: 1']);
  });

  it('builds adjacency graph when map is viewed as graph', () => {
    const graphMap: StructureWindow = {
      path: 'adj',
      type: 'map',
      viewMode: 'graph',
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    };

    applySnapshotToStructure(graphMap, {
      '1': [2, 3],
      '2': [3]
    });

    const nodeIds = graphMap.d3Data?.nodes.map(n => n.id);
    expect(nodeIds).toContain('1');
    expect(nodeIds).toContain('2');
    expect(nodeIds).toContain('3');
    expect(graphMap.d3Data?.links.length).toBe(3);
  });

  it('builds adjacency graph when 2D vector (vector<vector<int>>) is viewed as graph', () => {
    const graphVector: StructureWindow = {
      path: 'adj',
      type: 'array',
      viewMode: 'graph',
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    };

    // vector<vector<int>>: vertex 0 -> [1, 2], vertex 1 -> [2], vertex 2 -> [0]
    applySnapshotToStructure(graphVector, [[1, 2], [2], [0]]);

    const nodeIds = graphVector.d3Data?.nodes.map(n => n.id);
    expect(nodeIds).toContain('0');
    expect(nodeIds).toContain('1');
    expect(nodeIds).toContain('2');
    expect(graphVector.d3Data?.links.length).toBe(4);
  });

  it('builds weighted adjacency graph when 2D vector of pairs (vector<vector<pair<int,int>>>) is viewed as graph', () => {
    const graphVector: StructureWindow = {
      path: 'adj',
      type: 'array',
      viewMode: 'graph',
      children: [],
      d3Data: { arrayData: [], nodes: [], links: [], simulation: null, svg: null, width: 800, height: 600 }
    };

    // vertex 0 -> neighbor 1 (wt 10), neighbor 2 (wt 5); vertex 1 -> neighbor 2 (wt 2)
    applySnapshotToStructure(graphVector, [
      [[1, 10], [2, 5]],
      [[2, 2]],
      []
    ]);

    expect(graphVector.d3Data?.links.length).toBe(3);
    const linkLabels = graphVector.d3Data?.links.map(l => l.label);
    expect(linkLabels).toContain('10');
    expect(linkLabels).toContain('5');
    expect(linkLabels).toContain('2');
  });
});
