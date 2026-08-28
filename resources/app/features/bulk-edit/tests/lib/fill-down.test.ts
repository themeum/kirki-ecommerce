import { describe, expect, it } from 'vitest';

import {
  applyValue,
  getFillRange,
  getSelectionRange,
  resolveFillUpdate,
  resolveUnitInfoValue,
} from '@/features/bulk-edit/lib/fill-down';
import type { ProductVariant } from '@/features/products';

const buildVariant = (overrides: Partial<ProductVariant>): ProductVariant => ({
  name: 'Variant',
  media: null,
  sku: null,
  barcode: null,
  base_price: 10,
  base_price_money_object: { raw: 10, display: '$10', currency: { code: 'USD', symbol: '$' } },
  display_price: 10,
  display_price_money_object: { raw: 10, display: '$10', currency: { code: 'USD', symbol: '$' } },
  show_unit_price: null,
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
  available_quantity: 0,
  in_stock: true,
  committed_quantity: 0,
  low_stock_threshold: null,
  has_limit_per_order: false,
  max_per_order: null,
  tax_profile_id: null,
  shipping_profile_id: null,
  shipping_box_id: null,
  is_visible: true,
  is_physical_product: true,
  is_default: false,
  attribute_values: [],
  ...overrides,
});

describe('getSelectionRange / getFillRange', () => {
  it('returns an empty array for an empty selection', () => {
    expect(getSelectionRange(undefined, undefined)).toEqual([]);
    expect(getFillRange(undefined, 3)).toEqual([]);
  });

  it('returns a contiguous ascending range for two endpoints', () => {
    expect(getSelectionRange(2, 5)).toEqual([2, 3, 4, 5]);
  });

  it('returns the same range regardless of drag direction (reversed drag)', () => {
    expect(getSelectionRange(5, 2)).toEqual([2, 3, 4, 5]);
  });

  it('returns a single index for a single-cell selection', () => {
    expect(getSelectionRange(3, 3)).toEqual([3]);
  });
});

describe('resolveUnitInfoValue', () => {
  it('merges overrides onto the base variant\'s unit fields', () => {
    const base = buildVariant({ total_unit: 'g', base_unit: 'ml', total_unit_amount: 100, base_unit_amount: 10 });

    expect(resolveUnitInfoValue(base, { total_unit_amount: 200 })).toEqual({
      total_unit: 'g',
      base_unit: 'ml',
      total_unit_amount: 200,
      base_unit_amount: 10,
    });
  });

  it('resolves every field to undefined when there is no base variant', () => {
    expect(resolveUnitInfoValue(undefined)).toEqual({
      total_unit: undefined,
      base_unit: undefined,
      total_unit_amount: undefined,
      base_unit_amount: undefined,
    });
  });
});

describe('applyValue', () => {
  it('applies a value to a single-cell edit', () => {
    const variants = [buildVariant({})];

    const result = applyValue(variants, { fieldName: 'base_price' }, [0], 'base_price', 25);

    expect(result).toEqual({ key: 'base_price', value: 25, variant_index: [0] });
  });

  it('applies a value across a multi-cell selection', () => {
    const variants = [buildVariant({}), buildVariant({}), buildVariant({})];

    const result = applyValue(variants, { fieldName: 'sku' }, [0, 1, 2], 'sku', 'NEW-SKU');

    expect(result).toEqual({ key: 'sku', value: 'NEW-SKU', variant_index: [0, 1, 2] });
  });

  it('crosses into the unit-info row type: merges the value onto the base variant\'s unit fields', () => {
    const variants = [buildVariant({ total_unit: 'g', base_unit: 'ml', total_unit_amount: 100, base_unit_amount: 10 })];

    const result = applyValue(
      variants,
      { fieldName: 'base_price_per_unit', baseIndex: 0 },
      [0],
      'base_price_per_unit',
      { total_unit_amount: 250 },
    );

    expect(result).toEqual({
      key: 'base_price_per_unit',
      value: { total_unit: 'g', base_unit: 'ml', total_unit_amount: 250, base_unit_amount: 10 },
      variant_index: [0],
    });
  });
});

describe('resolveFillUpdate', () => {
  it('copies the base cell\'s value across a contiguous fill-down range', () => {
    const variants = [
      buildVariant({ base_price: 42 }),
      buildVariant({ base_price: 1 }),
      buildVariant({ base_price: 1 }),
    ];

    const result = resolveFillUpdate(variants, { fieldName: 'base_price', baseIndex: 0 }, [0, 1, 2]);

    expect(result).toEqual({ key: 'base_price', value: 42, variant_index: [0, 1, 2] });
  });

  it('crosses the row type boundary into unit-info: re-merges the base variant\'s own unit fields with no overrides', () => {
    const variants = [buildVariant({ total_unit: 'g', base_unit: 'ml', total_unit_amount: 100, base_unit_amount: 10 })];

    const result = resolveFillUpdate(variants, { fieldName: 'base_price_per_unit', baseIndex: 0 }, [0, 1]);

    expect(result).toEqual({
      key: 'base_price_per_unit',
      value: { total_unit: 'g', base_unit: 'ml', total_unit_amount: 100, base_unit_amount: 10 },
      variant_index: [0, 1],
    });
  });

  it('resolves an undefined source value when there is no base index', () => {
    const variants = [buildVariant({})];

    const result = resolveFillUpdate(variants, { fieldName: 'base_price' }, [0]);

    expect(result).toEqual({ key: 'base_price', value: undefined, variant_index: [0] });
  });
});
