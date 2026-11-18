import { describe, expect, it } from 'vitest';

import { FirstSaleSchema } from '@/features/home/schemas/catalog/first-sale';

const order = {
  id: 12,
  order_number: '#2026-2236',
  customer_name: 'Ibrahim Fischer',
  invoiced_total_money_object: {
    raw: 43.88,
    display: '£43.88',
    currency: { code: 'GBP', symbol: '£' },
  },
};

describe('FirstSaleSchema', () => {
  it('accepts the payload served by GET /home/first-sale', () => {
    const payload = { is_visible: true, should_celebrate: true, order };

    expect(FirstSaleSchema.parse(payload)).toEqual(payload);
  });

  it('accepts a store without a first order', () => {
    const payload = { is_visible: false, should_celebrate: false, order: null };

    expect(FirstSaleSchema.parse(payload)).toEqual(payload);
  });

  it('accepts an order without a customer name', () => {
    const payload = {
      is_visible: true,
      should_celebrate: false,
      order: { ...order, customer_name: null },
    };

    expect(FirstSaleSchema.parse(payload).order?.customer_name).toBeNull();
  });

  it('rejects a payload missing the celebration flag', () => {
    expect(FirstSaleSchema.safeParse({ is_visible: true, order }).success).toBe(false);
  });
});
