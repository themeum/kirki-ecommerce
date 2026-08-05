import { describe, expect, it } from 'vitest';

import { ShippingBoxFormSchema } from '@/schemas/forms/shipping-box-form';

describe('ShippingBoxFormSchema', () => {
  it('produces the exact payload, coercing string dimensions to numbers', () => {
    const result = ShippingBoxFormSchema.parse({
      name: 'Regular box',
      length: '12',
      width: '8',
      height: '6',
      unit: 'in',
      is_default: false,
    });
    expect(result).toEqual({
      name: 'Regular box',
      length: 12,
      width: 8,
      height: 6,
      unit: 'in',
      is_default: false,
    });
  });

  it('defaults dimensions and unit when unset', () => {
    const result = ShippingBoxFormSchema.parse({ name: 'Box' });
    expect(result.length).toBe(120);
    expect(result.width).toBe(80);
    expect(result.height).toBe(80);
    expect(result.unit).toBe('in');
    expect(result.is_default).toBe(false);
  });

  it('rejects a blank required name', () => {
    expect(ShippingBoxFormSchema.safeParse({ name: '  ' }).success).toBe(false);
  });
});
