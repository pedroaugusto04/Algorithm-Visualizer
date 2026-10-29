import { buildMapSnapshot } from './map-snapshot';

describe('buildMapSnapshot', () => {
  it('preserves structured map values and assigns a stable selection path', () => {
    const value = { '7': { to: 2, edges: [{ weight: 4 }] } };
    const snapshot = buildMapSnapshot('graph', value, 800, 600);

    expect(snapshot.nodes[1].value).toBe('7: {"to":2,"edges":[{"weight":4}]}');
    expect(snapshot.nodes[1].structuredValuePath).toBe('graph[7]');
    expect(JSON.stringify(snapshot.nodes[1].structuredValue)).toBe(JSON.stringify(value['7']));
    expect(snapshot.links).toHaveSize(1);
  });
});
