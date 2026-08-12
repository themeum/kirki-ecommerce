import { describe, expect, it } from 'vitest';

import { ShippingRegionFormSchema } from '@/features/settings/shipping/schemas/forms/shipping-region-form';

describe('ShippingRegionFormSchema', () => {
  const regions = [{ country: 'US', states: ['CA', 'NY'] }];

  it('produces the exact payload', () => {
    const result = ShippingRegionFormSchema.parse({ title: 'West', countries: ['US'], regions });
    expect(result).toEqual({ title: 'West', countries: ['US'], regions });
  });

  it('sends null for a blank title', () => {
    const result = ShippingRegionFormSchema.parse({ title: '', countries: ['US'], regions });
    expect(result.title).toBeNull();
  });

  it('rejects an empty countries or regions selection', () => {
    expect(ShippingRegionFormSchema.safeParse({ title: '', countries: [], regions }).success).toBe(false);
    expect(ShippingRegionFormSchema.safeParse({ title: '', countries: ['US'], regions: [] }).success).toBe(false);
  });
});
