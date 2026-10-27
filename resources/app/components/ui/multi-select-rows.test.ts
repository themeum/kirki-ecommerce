import { describe, expect, it } from 'vitest';

import { countChipsWithinRows } from '@/components/ui/multi-select-rows';

describe('countChipsWithinRows', () => {
  it('fits every chip when they all sit within the cap', () => {
    expect(countChipsWithinRows([0, 0, 0], 2)).toBe(3);
    expect(countChipsWithinRows([0, 0, 28, 28], 2)).toBe(4);
  });

  it('stops at the last chip of the capped row', () => {
    expect(countChipsWithinRows([0, 0, 28, 28, 56], 2)).toBe(4);
  });

  it('drops everything past a single-row cap', () => {
    expect(countChipsWithinRows([0, 0, 28], 1)).toBe(2);
  });

  it('treats tops within a pixel of each other as one row', () => {
    expect(countChipsWithinRows([0, 0.4, 1, 28], 1)).toBe(3);
  });

  it('returns nothing for a cap of zero rows', () => {
    expect(countChipsWithinRows([0, 28], 0)).toBe(0);
  });

  it('returns nothing for an empty selection', () => {
    expect(countChipsWithinRows([], 2)).toBe(0);
  });

  it('counts a chip taller than its neighbours as one row', () => {
    expect(countChipsWithinRows([0, 0, 0, 40, 40], 1)).toBe(3);
  });
});
