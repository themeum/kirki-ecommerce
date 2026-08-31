import { describe, expect, it } from 'vitest';

import type { ProductVariant } from '@/features/products';

import { buildBulkEditPayload } from '../../lib/payload';

const buildVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: 1,
  name: 'Small',
  media: null,
  sku: 'SKU-1',
  barcode: null,
  base_price: 100,
  base_price_money_object: { raw: 100, display: '$100.00', currency: { code: 'USD', symbol: '$' } },
  display_price: 100,
  display_price_money_object: { raw: 100, display: '$100.00', currency: { code: 'USD', symbol: '$' } },
  show_unit_price: false,
  base_unit: null,
  base_unit_amount: null,
  total_unit: null,
  total_unit_amount: null,
  base_sale_price: null,
  base_sale_price_money_object: null,
  display_sale_price: null,
  display_sale_price_money_object: null,
  base_cost_of_goods: null,
  base_cost_of_goods_money_object: null,
  display_cost_of_goods: null,
  display_cost_of_goods_money_object: null,
  weight: null,
  weight_unit: null,
  dimension_unit: null,
  charge_taxes: true,
  allow_back_order: false,
  track_inventory: true,
  available_quantity: 10,
  in_stock: true,
  committed_quantity: 2,
  low_stock_threshold: 5,
  has_limit_per_order: false,
  max_per_order: null,
  tax_profile_id: null,
  shipping_profile_id: null,
  shipping_box_id: null,
  is_visible: true,
  is_physical_product: true,
  is_default: true,
  attribute_values: [],
  attribute_value_labels: [],
  created_by: 1,
  updated_by: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('buildBulkEditPayload', () => {
  it('strips server-discarded keys', () => {
    const payload = buildBulkEditPayload([buildVariant()]);
    const row = payload.variants[0] as unknown as Record<string, unknown>;

    expect(row).not.toHaveProperty('base_price_money_object');
    expect(row).not.toHaveProperty('display_price');
    expect(row).not.toHaveProperty('display_price_money_object');
    expect(row).not.toHaveProperty('committed_quantity');
    expect(row).not.toHaveProperty('created_at');
    expect(row).not.toHaveProperty('updated_at');
    expect(row).not.toHaveProperty('created_by');
    expect(row).not.toHaveProperty('updated_by');
    expect(row).not.toHaveProperty('display_sale_price');
    expect(row).not.toHaveProperty('display_cost_of_goods');
  });

  it('keeps money in major units, unconverted', () => {
    const payload = buildBulkEditPayload([buildVariant({ base_price: 145.56, base_sale_price: 99.99 })]);

    expect(payload.variants[0].base_price).toBe(145.56);
    expect(payload.variants[0].base_sale_price).toBe(99.99);
  });

  it('includes id on every row', () => {
    const payload = buildBulkEditPayload([buildVariant({ id: 7 }), buildVariant({ id: 8 })]);

    expect(payload.variants.map((row) => row.id)).toEqual([7, 8]);
  });

  it('emits media as a numeric id, or null when absent', () => {
    const withMedia = buildBulkEditPayload([
      buildVariant({ media: { id: 42, url: 'https://example.com/a.jpg' } }),
    ]);
    const withoutMedia = buildBulkEditPayload([buildVariant({ media: null })]);

    expect(withMedia.variants[0].media).toBe(42);
    expect(withoutMedia.variants[0].media).toBeNull();
  });
});
