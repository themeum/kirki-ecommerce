import { describe, expect, it } from 'vitest';

import { VariantFormSchema } from '@/features/inventory/schemas/forms/variant-form';

describe('VariantFormSchema', () => {
  const base = {
    id: 7,
    media: null,
    sku: '',
    base_price: 29,
    show_unit_price: false,
    base_unit: '',
    base_unit_amount: null,
    total_unit: '',
    total_unit_amount: null,
    base_sale_price: null,
    base_cost_of_goods: null,
    weight: null,
    weight_unit: '',
    charge_taxes: null,
    allow_back_order: null,
    track_inventory: null,
    available_quantity: null,
    in_stock: false,
    low_stock_threshold: null,
    has_limit_per_order: null,
    max_per_order: null,
    tax_profile_id: null,
    shipping_profile_id: null,
    shipping_box_id: null,
    is_visible: null,
    is_physical_product: null,
  };

  it('produces the exact payload for a fully filled form', () => {
    const result = VariantFormSchema.parse({
      ...base,
      sku: 'SKU-XYZ-1234',
      base_sale_price: 19.99,
      base_cost_of_goods: 15,
      show_unit_price: true,
      base_unit: 'kg',
      base_unit_amount: 1,
      total_unit: 'kg',
      total_unit_amount: 2,
      weight: 500,
      weight_unit: 'mg',
      charge_taxes: false,
      allow_back_order: true,
      track_inventory: true,
      available_quantity: 12,
      in_stock: true,
      low_stock_threshold: 3,
      has_limit_per_order: true,
      max_per_order: 1,
      tax_profile_id: 2,
      shipping_profile_id: 3,
      shipping_box_id: 4,
      is_visible: false,
      is_physical_product: false,
    });

    expect(result).toEqual({
      id: 7,
      media: null,
      sku: 'SKU-XYZ-1234',
      base_price: 29,
      show_unit_price: true,
      base_unit: 'kg',
      base_unit_amount: 1,
      total_unit: 'kg',
      total_unit_amount: 2,
      base_sale_price: 19.99,
      base_cost_of_goods: 15,
      weight: 500,
      weight_unit: 'mg',
      charge_taxes: false,
      allow_back_order: true,
      track_inventory: true,
      available_quantity: 12,
      in_stock: true,
      low_stock_threshold: 3,
      has_limit_per_order: true,
      max_per_order: 1,
      tax_profile_id: 2,
      shipping_profile_id: 3,
      shipping_box_id: 4,
      is_visible: false,
      is_physical_product: false,
    });
  });

  it('rejects a sale price greater than the regular price', () => {
    const result = VariantFormSchema.safeParse({
      ...base,
      base_price: 29,
      base_sale_price: 39,
    });

    expect(result.success).toBe(false);

    const messages = (result.error?.issues ?? [])
      .filter((item) => item.path.join('.') === 'base_sale_price')
      .map((item) => item.message);

    expect(messages).toContain(
      'The sale price cannot be greater than the regular price.',
    );
  });

  it('accepts a sale price below the regular price', () => {
    const result = VariantFormSchema.safeParse({
      ...base,
      base_price: 29,
      base_sale_price: 19.99,
    });

    expect(result.success).toBe(true);
  });

  it('sends null for a blank sku and blank unit fields', () => {
    const result = VariantFormSchema.parse(base);

    expect(result.sku).toBeNull();
    expect(result.base_unit).toBeNull();
    expect(result.total_unit).toBeNull();
    expect(result.weight_unit).toBeNull();
  });

  it('applies the defaults the product form applies for absent booleans', () => {
    const result = VariantFormSchema.parse(base);

    expect(result.charge_taxes).toBe(true);
    expect(result.is_visible).toBe(true);
    expect(result.is_physical_product).toBe(true);
    expect(result.allow_back_order).toBe(false);
    expect(result.track_inventory).toBe(false);
    expect(result.has_limit_per_order).toBe(false);
    expect(result.available_quantity).toBe(0);
  });

  it('collapses a media object to its numeric id', () => {
    const result = VariantFormSchema.parse({
      ...base,
      media: { id: 11, url: 'https://example.test/variant.png' },
    });

    expect(result.media).toBe(11);
  });

  it('does not carry barcode, is_default, or attribute_values', () => {
    const result = VariantFormSchema.parse({
      ...base,
      barcode: '123',
      is_default: true,
      attribute_values: [1, 2],
    });

    expect(result).not.toHaveProperty('barcode');
    expect(result).not.toHaveProperty('is_default');
    expect(result).not.toHaveProperty('attribute_values');
  });
});
