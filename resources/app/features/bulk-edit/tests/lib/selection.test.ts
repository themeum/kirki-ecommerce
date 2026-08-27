import { describe, expect, it } from 'vitest';

import {
  clearSelection,
  commitFill,
  extendSelection,
  fillRange,
  isCellFilled,
  isCellSelected,
  isHandleRow,
  selectionRange,
  startFill,
  startSelection,
  toggleSelection,
  updateFill,
} from '../../lib/selection';

describe('startSelection', () => {
  it('starts a single-cell selection', () => {
    const state = startSelection(null, 'base_price', 3, true);

    expect(selectionRange(state)).toEqual([3]);
    expect(state?.mode).toBe('select');
  });

  it('does not start a selection for a non-selectable field', () => {
    const before = startSelection(null, 'base_price', 3, true);
    const after = startSelection(before, 'variant', 0, false);

    expect(after).toBe(before);
    expect(selectionRange(after)).toEqual([3]);
  });
});

describe('extendSelection', () => {
  it('produces the range between anchor and focus', () => {
    const state = extendSelection(startSelection(null, 'base_price', 2, true), 'base_price', 5, true);

    expect(selectionRange(state)).toEqual([2, 3, 4, 5]);
  });

  it('normalizes a reversed (upward) drag', () => {
    const state = extendSelection(startSelection(null, 'base_price', 5, true), 'base_price', 2, true);

    expect(selectionRange(state)).toEqual([2, 3, 4, 5]);
  });

  it('starts a new selection when the column changes', () => {
    const priceSelection = extendSelection(startSelection(null, 'base_price', 2, true), 'base_price', 5, true);
    const nextSelection = extendSelection(priceSelection, 'base_sale_price', 1, true);

    expect(nextSelection?.field).toBe('base_sale_price');
    expect(selectionRange(nextSelection)).toEqual([1]);
  });

  it('is a no-op for a non-selectable field', () => {
    const before = startSelection(null, 'base_price', 2, true);
    const after = extendSelection(before, 'committed_quantity', 4, false);

    expect(after).toBe(before);
  });
});

describe('fill mode transitions', () => {
  it('starts a fill from the bottom edge of the selection', () => {
    const selected = extendSelection(startSelection(null, 'base_price', 1, true), 'base_price', 3, true);
    const filling = startFill(selected);

    expect(filling?.mode).toBe('fill');
    expect(filling?.fillOriginRow).toBe(3);
    expect(isHandleRow(filling, 'base_price', 3)).toBe(true);
  });

  it('extends the fill range as the drag continues', () => {
    const selected = extendSelection(startSelection(null, 'base_price', 1, true), 'base_price', 3, true);
    const filling = updateFill(startFill(selected), 7);

    expect(fillRange(filling)).toEqual([3, 4, 5, 6, 7]);
    expect(isCellFilled(filling, 'base_price', 7)).toBe(true);
    expect(isCellFilled(filling, 'base_price', 2)).toBe(false);
  });

  it('commit collapses fill back into a select spanning the combined range', () => {
    const selected = extendSelection(startSelection(null, 'base_price', 1, true), 'base_price', 3, true);
    const committed = commitFill(updateFill(startFill(selected), 7));

    expect(committed?.mode).toBe('select');
    expect(selectionRange(committed)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('a single-cell selection has its own row as the fill origin', () => {
    const filling = startFill(startSelection(null, 'sku', 4, true));

    expect(filling?.fillOriginRow).toBe(4);
  });

  it('the handle sits at the bottom-most row of a non-contiguous selection', () => {
    const rowTwo = startSelection(null, 'base_price', 2, true);
    const rowFive = toggleSelection(rowTwo, 'base_price', 5, true);
    const rowNine = toggleSelection(rowFive, 'base_price', 9, true);
    const filling = startFill(rowNine);

    expect(filling?.fillOriginRow).toBe(9);
    expect(isHandleRow(rowNine, 'base_price', 9)).toBe(true);
    expect(isHandleRow(rowNine, 'base_price', 5)).toBe(false);
  });

  it('filling from a non-contiguous selection collapses it into one contiguous range', () => {
    const rowTwo = startSelection(null, 'base_price', 2, true);
    const rowFive = toggleSelection(rowTwo, 'base_price', 5, true);
    const rowNine = toggleSelection(rowFive, 'base_price', 9, true);
    const committed = commitFill(updateFill(startFill(rowNine), 12));

    expect(committed?.mode).toBe('select');
    expect(selectionRange(committed)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(fillRange(updateFill(startFill(rowNine), 12))).toEqual([9, 10, 11, 12]);
  });
});

describe('toggleSelection', () => {
  it('adds disjoint rows one at a time', () => {
    const rowTwo = startSelection(null, 'base_price', 2, true);
    const rowFive = toggleSelection(rowTwo, 'base_price', 5, true);
    const rowNine = toggleSelection(rowFive, 'base_price', 9, true);

    expect(selectionRange(rowNine)).toEqual([2, 5, 9]);
  });

  it('toggles a previously-added row back off', () => {
    const rowTwo = startSelection(null, 'base_price', 2, true);
    const rowFive = toggleSelection(rowTwo, 'base_price', 5, true);
    const rowNine = toggleSelection(rowFive, 'base_price', 9, true);
    const withoutFive = toggleSelection(rowNine, 'base_price', 5, true);

    expect(selectionRange(withoutFive)).toEqual([2, 9]);
  });

  it('toggles a row out of the middle of a dragged range', () => {
    const dragged = extendSelection(startSelection(null, 'base_price', 3, true), 'base_price', 7, true);
    const withoutFive = toggleSelection(dragged, 'base_price', 5, true);

    expect(selectionRange(withoutFive)).toEqual([3, 4, 6, 7]);
    expect(isCellSelected(withoutFive, 'base_price', 5)).toBe(false);
  });

  it('clears the selection entirely when toggling off the only remaining row', () => {
    const single = startSelection(null, 'base_price', 4, true);
    const cleared = toggleSelection(single, 'base_price', 4, true);

    expect(cleared).toBeNull();
  });

  it('starts fresh when toggling in a different column', () => {
    const priceSelection = startSelection(null, 'base_price', 2, true);
    const salePriceSelection = toggleSelection(priceSelection, 'base_sale_price', 1, true);

    expect(salePriceSelection?.field).toBe('base_sale_price');
    expect(selectionRange(salePriceSelection)).toEqual([1]);
  });

  it('is a no-op for a non-selectable field', () => {
    const before = startSelection(null, 'base_price', 2, true);
    const after = toggleSelection(before, 'committed_quantity', 4, false);

    expect(after).toBe(before);
  });
});

describe('clearSelection', () => {
  it('returns null', () => {
    expect(clearSelection()).toBeNull();
  });
});

describe('isCellSelected', () => {
  it('is false for a different column', () => {
    const state = extendSelection(startSelection(null, 'base_price', 1, true), 'base_price', 3, true);

    expect(isCellSelected(state, 'base_sale_price', 2)).toBe(false);
  });
});
