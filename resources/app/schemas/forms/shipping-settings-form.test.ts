import { describe, expect, it } from 'vitest';

import { ShippingSettingsFormSchema } from '@/schemas/forms/shipping-settings-form';

describe('ShippingSettingsFormSchema', () => {
  it('produces the exact payload — shipping_zones is the only field', () => {
    const zones = [{ id: '1', title: 'US', is_enabled: true, regions: [], shipping_methods: [] }];
    const result = ShippingSettingsFormSchema.parse({ shipping_zones: zones });
    expect(result).toEqual({ shipping_zones: zones });
  });

  it('defaults to an empty array when unset', () => {
    const result = ShippingSettingsFormSchema.parse({});
    expect(result.shipping_zones).toEqual([]);
  });
});
