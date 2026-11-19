import { describe, expect, it } from 'vitest';

import { DashboardAttentionSchema } from '@/features/home/schemas/catalog/dashboard-attention';

const payload = {
  to_ship: { count: 3, late_count: 1 },
  to_collect: {
    count: 2,
    base_total_money_object: {
      raw: 100,
      display: '$100.00',
      short_display: '$100.00',
      currency: { code: 'USD', symbol: '$' },
    },
  },
  out_of_stock: { count: 4 },
  low_stock: {
    total: 6,
    items: [
      {
        variant_id: 9,
        product_id: 3,
        product_name: 'Mug',
        variant_name: 'Blue / Large',
        image: null,
        available_quantity: 2,
      },
    ],
  },
};

describe('DashboardAttentionSchema', () => {
  it('accepts the payload served by GET /dashboard/attention', () => {
    expect(DashboardAttentionSchema.parse(payload)).toEqual(payload);
  });

  it('rejects a payload without the low-stock rows', () => {
    expect(
      DashboardAttentionSchema.safeParse({ ...payload, low_stock: { total: 0 } }).success,
    ).toBe(false);
  });
});
