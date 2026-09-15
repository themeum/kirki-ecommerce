import { describe, expect, it } from 'vitest';

import { ShippingProfileFormSchema } from '@/features/settings/shipping/schemas/forms/shipping-profile-form';

describe('ShippingProfileFormSchema', () => {
  it('produces the exact payload', () => {
    expect(ShippingProfileFormSchema.parse({ name: 'Fragile' })).toEqual({
      name: 'Fragile',
      is_default: false,
    });
  });

  it('passes is_default through', () => {
    expect(
      ShippingProfileFormSchema.parse({ name: 'Fragile', is_default: true }),
    ).toEqual({ name: 'Fragile', is_default: true });
  });

  it('rejects a blank required name', () => {
    expect(ShippingProfileFormSchema.safeParse({ name: '  ' }).success).toBe(false);
  });
});
