import { buildMapSnapshot, buildMapGraphSnapshot } from './map-snapshot';

describe('buildMapSnapshot', () => {
  it('preserves structured map values and assigns a stable selection path', () => {
    const value = { '7': { to: 2, edges: [{ weight: 4 }] } };
    const snapshot = buildMapSnapshot('graph', value, 800, 600);

    expect(snapshot.nodes[1].value).toBe('7: {"to":2,"edges":[{"weight":4}]}');
    expect(snapshot.nodes[1].structuredValuePath).toBe('graph[7]');
    expect(JSON.stringify(snapshot.nodes[1].structuredValue)).toBe(JSON.stringify(value['7']));
    expect(snapshot.links).toHaveSize(1);
  });

  it('filters empty disconnected nodes when graph is built from large arrays', () => {
    const adj: any[] = Array.from({ length: 50 }, () => []);
    adj[1] = [2];
    adj[2] = [1];

    const snapshot = buildMapGraphSnapshot('adj', adj, 800, 600, true);

    const nodeIds = snapshot.nodes.map(n => n.id);
    expect(nodeIds).toContain('1');
    expect(nodeIds).toContain('2');
    expect(nodeIds).not.toContain('0');
    expect(nodeIds).not.toContain('3');
    expect(nodeIds).not.toContain('40');
    expect(snapshot.nodes.length).toBe(2);
    expect(snapshot.links.length).toBe(2);
  });
});
