import { describe, expect, it } from 'vitest';

import { ShippingBoxSchema, ShippingProfileSchema, ShippingZoneSchema } from '@/schemas/catalog/shipping';

describe('ShippingProfileSchema', () => {
  it('accepts the documented list item (shipping-profiles/list-10.yml)', () => {
    const result = ShippingProfileSchema.safeParse({
      id: 1,
      name: 'Heavy Weight',
      created_at: '2025-11-26 10:52:00',
      updated_at: '2025-11-26 10:52:00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an unrecognized extra field', () => {
    const result = ShippingProfileSchema.safeParse({
      id: 1,
      name: 'Heavy Weight',
      unexpected: 'value',
    });
    expect(result.success).toBe(true);
  });

  it('accepts the optional fields being absent', () => {
    const result = ShippingProfileSchema.safeParse({ id: 1, name: 'Heavy Weight' });
    expect(result.success).toBe(true);
  });
});

describe('ShippingBoxSchema', () => {
  it('accepts the documented list item (shipping-boxes/list-9.yml)', () => {
    const result = ShippingBoxSchema.safeParse({
      id: 1,
      name: 'Large Box',
      description: 'Suitable for oversized products',
      width: 12.5,
      height: 8.3,
      length: 20.75,
      unit: 'cm',
      is_default: true,
      created_at: '2025-11-26 09:54:49',
      updated_at: '2025-11-26 09:54:49',
    });
    expect(result.success).toBe(true);
  });

  it('accepts the optional fields being absent', () => {
    const result = ShippingBoxSchema.safeParse({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe('ShippingZoneSchema', () => {
  const documentedZone = {
    id: 'f12fdsfsdfsdf343432jh0',
    is_enabled: true,
    title: 'All Countries',
    regions: [{ country: 'BD', states: ['5665', '6565'] }],
    shipping_methods: [
      {
        id: 'fsdfdsfsdfsdf343432jh4',
        is_enabled: true,
        name: 'Standard Delivery',
        type: 'flat_rate',
        amount: 14,
        is_taxable: true,
        description: null,
        shipping_rules: [
          {
            relation: 'AND',
            conditions: [{ type: 'product_profile', operator: '=', value: 'fragile' }],
            action: { type: 'set_shipping_cost', value: 5 },
          },
        ],
      },
      {
        id: 'fsdfdsfsd56df343432jh4',
        is_enabled: true,
        name: 'Local Pickup',
        type: 'local_pickup',
        address: null,
        has_fee: false,
        amount: 9,
        is_taxable: false,
        description: null,
        has_pick_time: false,
        pickup_time_start: null,
        pickup_time_end: null,
        shipping_rules: [],
      },
      {
        id: 'f12fdsfsdfsdf343432jh4',
        is_enabled: true,
        name: 'Rate by Weight',
        type: 'weight',
        ranges: [
          { from: 0, to: 1, amount: 5 },
          { from: 1, to: 2, amount: 10 },
        ],
        amount: 30,
        is_taxable: false,
        description: null,
        shipping_rules: [],
      },
    ],
    shipping_carriers: [
      {
        is_enabled: true,
        name: 'DHL',
        type: 'flat_rate',
        rate: 10,
        is_taxable: true,
        description: null,
        shipping_rules: [],
      },
    ],
  };

  it('accepts the documented zone (settings/shipping.yml)', () => {
    const result = ShippingZoneSchema.safeParse(documentedZone);
    expect(result.success).toBe(true);
  });

  it('accepts an unrecognized extra field on the zone and a nested method', () => {
    const result = ShippingZoneSchema.safeParse({
      ...documentedZone,
      unexpected: 'value',
      shipping_methods: [{ ...documentedZone.shipping_methods[0], unexpected: 'value' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a zone with only its identity field', () => {
    const result = ShippingZoneSchema.safeParse({ id: 1 });
    expect(result.success).toBe(true);
  });
});
