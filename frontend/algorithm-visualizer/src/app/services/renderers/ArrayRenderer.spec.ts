import { formatArrayCellValue } from './ArrayRenderer';

describe('formatArrayCellValue', () => {
  it('keeps primitive values concise', () => {
    expect(formatArrayCellValue(42)).toBe('42');
    expect(formatArrayCellValue(true)).toBe('true');
    expect(formatArrayCellValue('node')).toBe('node');
    expect(formatArrayCellValue(null)).toBe('');
  });

  it('formats structs and nested values as readable JSON', () => {
    expect(formatArrayCellValue({
      name: 'A',
      edges: [{ to: 2, weight: 7 }]
    })).toBe('{"name":"A","edges":[{"to":2,"weight":7}]}');
  });
});
