import { describe, expect, it } from 'vitest';

import { RegionsDialogFormSchema } from '@/schemas/shared/region';

describe('RegionsDialogFormSchema', () => {
  const regions = [{ country: 'US', states: ['CA', 'NY'] }];

  it('produces the exact payload', () => {
    const result = RegionsDialogFormSchema.parse({ title: 'West', countries: ['US'], regions });
    expect(result).toEqual({ title: 'West', countries: ['US'], regions });
  });

  it('sends null for a blank title', () => {
    const result = RegionsDialogFormSchema.parse({ title: '', countries: ['US'], regions });
    expect(result.title).toBeNull();
  });

  it('rejects an empty countries or regions selection', () => {
    expect(RegionsDialogFormSchema.safeParse({ title: '', countries: [], regions }).success).toBe(false);
    expect(RegionsDialogFormSchema.safeParse({ title: '', countries: ['US'], regions: [] }).success).toBe(false);
  });
});
