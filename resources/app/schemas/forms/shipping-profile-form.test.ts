import { describe, expect, it } from 'vitest';

import { ShippingProfileFormSchema } from '@/schemas/forms/shipping-profile-form';

describe('ShippingProfileFormSchema', () => {
  it('produces the exact payload', () => {
    expect(ShippingProfileFormSchema.parse({ name: 'Fragile' })).toEqual({ name: 'Fragile' });
  });

  it('rejects a blank required name', () => {
    expect(ShippingProfileFormSchema.safeParse({ name: '  ' }).success).toBe(false);
  });
});
