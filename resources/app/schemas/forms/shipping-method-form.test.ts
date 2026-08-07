import { describe, expect, it } from 'vitest';

import { ShippingMethodFormSchema } from '@/schemas/forms/shipping-method-form';

describe('ShippingMethodFormSchema', () => {
  it('produces the flat rate payload', () => {
    const result = ShippingMethodFormSchema.parse({
      type: 'flat_rate',
      name: 'Standard Delivery',
      description: '2-3 business days',
      base_amount: '10',
      is_taxable: true,
    });

    expect(result).toEqual({
      type: 'flat_rate',
      name: 'Standard Delivery',
      description: '2-3 business days',
      base_amount: 10,
      is_taxable: true,
    });
  });

  it('rejects a flat rate method with no amount', () => {
    expect(
      ShippingMethodFormSchema.safeParse({
        type: 'flat_rate',
        name: 'Standard Delivery',
        base_amount: '',
      }).success,
    ).toBe(false);
  });

  it('rejects any method type with a blank name', () => {
    expect(
      ShippingMethodFormSchema.safeParse({
        type: 'flat_rate',
        name: '  ',
        base_amount: '5',
      }).success,
    ).toBe(false);
  });

  it('produces the local pickup payload, dropping the fee when disabled', () => {
    const result = ShippingMethodFormSchema.parse({
      type: 'local_pickup',
      name: 'Store Pickup',
      address: '123 Main St',
      has_fee: false,
      base_amount: '5',
      has_pick_time: true,
      pickup_time_start: '09:00',
      pickup_time_end: '17:00',
    });

    expect(result).toEqual({
      type: 'local_pickup',
      name: 'Store Pickup',
      description: null,
      address: '123 Main St',
      has_fee: false,
      base_amount: null,
      has_pick_time: true,
      pickup_time_start: '09:00',
      pickup_time_end: '17:00',
    });
  });

  it('requires a fee amount when the pickup fee is enabled', () => {
    expect(
      ShippingMethodFormSchema.safeParse({
        type: 'local_pickup',
        name: 'Store Pickup',
        has_fee: true,
        base_amount: '',
      }).success,
    ).toBe(false);
  });

  it('does not require a fee amount when the pickup fee is disabled', () => {
    expect(
      ShippingMethodFormSchema.safeParse({
        type: 'local_pickup',
        name: 'Store Pickup',
        has_fee: false,
        base_amount: '',
      }).success,
    ).toBe(true);
  });

  it('produces the rate by weight payload with numeric ranges', () => {
    const result = ShippingMethodFormSchema.parse({
      type: 'weight',
      name: 'Heavy Items',
      ranges: [{ from: '0', to: '10', base_amount: '15' }],
      is_taxable: false,
      is_free_shipping_enabled: true,
      base_free_shipping_min_amount: '100',
    });

    expect(result).toEqual({
      type: 'weight',
      name: 'Heavy Items',
      description: null,
      ranges: [{ from: 0, to: 10, base_amount: 15 }],
      is_taxable: false,
      is_free_shipping_enabled: true,
      base_free_shipping_min_amount: 100,
    });
  });

  it('rejects a rate by weight method with no ranges', () => {
    expect(
      ShippingMethodFormSchema.safeParse({
        type: 'weight',
        name: 'Heavy Items',
        ranges: [],
      }).success,
    ).toBe(false);
  });

  it('rejects an incomplete range row', () => {
    expect(
      ShippingMethodFormSchema.safeParse({
        type: 'weight',
        name: 'Heavy Items',
        ranges: [{ from: '0', to: '10', base_amount: '' }],
      }).success,
    ).toBe(false);
  });

  it('does not require a free shipping minimum when free shipping is disabled', () => {
    const result = ShippingMethodFormSchema.parse({
      type: 'weight',
      name: 'Heavy Items',
      ranges: [{ from: '0', to: '10', base_amount: '15' }],
      is_free_shipping_enabled: false,
    });

    if (result.type !== 'weight') {
      throw new Error('expected a weight-type result');
    }
    expect(result.base_free_shipping_min_amount).toBeNull();
  });

  it('drops the previous type values when switching type', () => {
    const result = ShippingMethodFormSchema.parse({
      type: 'local_pickup',
      name: 'Store Pickup',
      has_fee: false,
      base_amount: '10',
      ranges: [{ from: '0', to: '10', base_amount: '15' }],
    });

    expect(result).not.toHaveProperty('ranges');
    expect(result).toEqual({
      type: 'local_pickup',
      name: 'Store Pickup',
      description: null,
      address: null,
      has_fee: false,
      base_amount: null,
      has_pick_time: false,
      pickup_time_start: null,
      pickup_time_end: null,
    });
  });
});
