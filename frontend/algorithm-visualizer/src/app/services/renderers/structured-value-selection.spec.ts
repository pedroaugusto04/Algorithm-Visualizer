import {
  refreshStructuredSelection,
  toggleStructuredSelection
} from './structured-value-selection';

describe('structured-value-selection', () => {
  it('tracks a selected path and refreshes it with the next snapshot', () => {
    const onSelected = jasmine.createSpy('onSelected');
    const context: any = { onStructuredValueSelected: onSelected };
    const initial = { name: 'node', weight: 2 };

    toggleStructuredSelection(context, { path: 'nodes[0]', value: initial });
    refreshStructuredSelection(context, [{ path: 'nodes[0]', value: { name: 'node', weight: 5 } }]);

    expect(onSelected.calls.argsFor(0)[0].hasPrevious).toBeFalse();
    expect(onSelected.calls.argsFor(1)[0].previousValue).toEqual(initial);
    expect(onSelected.calls.argsFor(1)[0].value.weight).toBe(5);
    expect(context.selectedValueSnapshot).toEqual({ name: 'node', weight: 5 });
  });

  it('clears the selection when the selected value disappears', () => {
    const onSelected = jasmine.createSpy('onSelected');
    const context: any = { onStructuredValueSelected: onSelected };
    toggleStructuredSelection(context, { path: 'nodes[0]', value: { id: 1 } });

    refreshStructuredSelection(context, []);

    expect(context.selectedValuePath).toBeUndefined();
    expect(onSelected).toHaveBeenCalledWith(null);
  });
});
