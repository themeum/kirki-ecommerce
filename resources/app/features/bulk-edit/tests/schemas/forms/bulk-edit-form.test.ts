import { describe, expect, it } from 'vitest';

import { BulkEditFormSchema, BulkEditVariantSchema } from '@/features/bulk-edit/schemas/forms/bulk-edit-form';

describe('BulkEditVariantSchema', () => {
  const base = {
    id: 7,
    base_price: 29,
    base_sale_price: null,
    base_cost_of_goods: null,
    sku: 'SKU-1',
    weight: null,
    available_quantity: 12,
    low_stock_threshold: 3,
    max_per_order: 1,
  };

  it('passes a filled row through unchanged', () => {
    const result = BulkEditVariantSchema.parse({
      ...base,
      base_sale_price: '19.99',
      base_cost_of_goods: 15,
      weight: 500,
    });

    expect(result).toMatchObject({
      id: 7,
      base_price: 29,
      base_sale_price: '19.99',
      base_cost_of_goods: 15,
      sku: 'SKU-1',
      weight: 500,
      available_quantity: 12,
      low_stock_threshold: 3,
      max_per_order: 1,
    });
  });

  it('sends null for every numeric cell the merchant cleared', () => {
    const result = BulkEditVariantSchema.parse({
      ...base,
      base_price: '',
      base_sale_price: '',
      base_cost_of_goods: '',
      weight: '',
    });

    expect(result.base_price).toBeNull();
    expect(result.base_sale_price).toBeNull();
    expect(result.base_cost_of_goods).toBeNull();
    expect(result.weight).toBeNull();
  });

  it('keeps a zero cell rather than treating it as blank', () => {
    const result = BulkEditVariantSchema.parse({ ...base, base_price: 0, weight: '0' });

    expect(result.base_price).toBe(0);
    expect(result.weight).toBe(0);
  });

  it('rejects a sale price greater than the regular price', () => {
    const result = BulkEditVariantSchema.safeParse({
      ...base,
      base_price: 29,
      base_sale_price: 39,
    });

    expect(result.success).toBe(false);
  });
});

describe('BulkEditFormSchema', () => {
  it('normalizes cleared cells across every row', () => {
    const result = BulkEditFormSchema.parse({
      variants: [
        { id: 1, base_price: '', weight: '' },
        { id: 2, base_price: '12.50', weight: 400 },
      ],
    });

    expect(result.variants[0].base_price).toBeNull();
    expect(result.variants[0].weight).toBeNull();
    expect(result.variants[1].base_price).toBe('12.50');
    expect(result.variants[1].weight).toBe(400);
  });
});
