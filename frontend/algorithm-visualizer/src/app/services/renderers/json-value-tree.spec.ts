import { projectJsonValueTree } from './json-value-tree';

describe('projectJsonValueTree', () => {
  it('projects nested objects and arrays with stable paths', () => {
    const tree = projectJsonValueTree('nodes[0]', 'nodes[0]', {
      name: 'a',
      edges: [{ to: 2, weight: 7 }]
    });

    expect(tree.kind).toBe('object');
    expect(tree.children.map(child => child.label)).toEqual(['name', 'edges']);
    expect(tree.children[1].path).toBe('nodes[0].edges');
    expect(tree.children[1].children[0].path).toBe('nodes[0].edges[0]');
    expect(tree.children[1].children[0].children[1].displayValue).toBe('7');
  });

  it('marks changed leaves and removed array entries between snapshots', () => {
    const tree = projectJsonValueTree(
      'node',
      'nodes[0]',
      { edges: [{ to: 3 }] },
      { edges: [{ to: 2 }, { to: 4 }] },
      true
    );
    const edges = tree.children[0];

    expect(edges.children[0].children[0].changed).toBeTrue();
    expect(edges.children[1].removed).toBeTrue();
    expect(edges.children[1].displayValue).toBe('{"to":4} (removed)');
  });
});
