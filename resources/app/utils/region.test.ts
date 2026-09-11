import { describe, expect, it } from 'vitest';

import { mergeRegionsByCountry } from '@/utils/region';

describe('mergeRegionsByCountry', () => {
  it('returns an empty list when given no regions', () => {
    expect(mergeRegionsByCountry()).toEqual([]);
    expect(mergeRegionsByCountry([])).toEqual([]);
  });

  it('unions the state ids of the same country across entries', () => {
    const merged = mergeRegionsByCountry([
      { country: 'US', states: ['CA', 'NY'], flag: '🇺🇸' },
      { country: 'US', states: ['NY', 'TX'] },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].country).toBe('US');
    expect(merged[0].states).toEqual(['CA', 'NY', 'TX']);
    expect(merged[0].flag).toBe('🇺🇸');
  });

  it('keeps a stateless country as an empty state list', () => {
    expect(mergeRegionsByCountry([{ country: 'SG', states: [] }])).toEqual([
      { country: 'SG', states: [], flag: undefined },
    ]);
  });

  it('keeps distinct countries separate and de-dups repeated state ids', () => {
    const merged = mergeRegionsByCountry([
      { country: 'US', states: ['CA', 'CA'] },
      { country: 'CA', states: ['ON'] },
    ]);

    expect(merged).toEqual([
      { country: 'US', states: ['CA'], flag: undefined },
      { country: 'CA', states: ['ON'], flag: undefined },
    ]);
  });
});
