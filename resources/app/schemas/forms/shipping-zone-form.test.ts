import { describe, expect, it } from 'vitest';

import { ShippingZoneFormSchema } from '@/schemas/forms/shipping-zone-form';

describe('ShippingZoneFormSchema', () => {
  const regions = [{ country: 'US', states: ['CA', 'NY'] }];

  it('produces the exact payload', () => {
    const result = ShippingZoneFormSchema.parse({ title: 'West Coast', regions });
    expect(result).toEqual({ title: 'West Coast', regions });
  });

  it('rejects a blank title', () => {
    expect(ShippingZoneFormSchema.safeParse({ title: '  ', regions }).success).toBe(false);
  });

  it('rejects a zone with no regions', () => {
    expect(ShippingZoneFormSchema.safeParse({ title: 'West Coast', regions: [] }).success).toBe(false);
  });
});
