import { describe, expect, it } from 'vitest';

import {
  deriveSelectedCheckedIndexes,
  getCombinedVariantData,
  getGroupVariants,
  getSecondaryAttributeCount,
  getVariantIndexArray,
} from '@/features/products/lib/variant-group';
import type { ProductVariant } from '@/features/products/schemas/catalog/variant';

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

const RED = 11;
const BLUE = 12;
const SMALL = 21;
const MEDIUM = 22;

describe('getGroupVariants', () => {
  it('keeps only variants tagged with the group attribute value', () => {
    const redSmall = buildVariant({ id: 1, attribute_values: [RED, SMALL] });
    const redMedium = buildVariant({ id: 2, attribute_values: [RED, MEDIUM] });
    const blueSmall = buildVariant({ id: 3, attribute_values: [BLUE, SMALL] });

    expect(getGroupVariants([redSmall, redMedium, blueSmall], RED)).toEqual([redSmall, redMedium]);
  });
});

describe('getCombinedVariantData', () => {
  it('reports the same min and max price when every variant matches', () => {
    const group = [
      buildVariant({ base_price: 10 }),
      buildVariant({ base_price: 10 }),
    ];

    expect(getCombinedVariantData(group)).toMatchObject({ minPrice: 10, maxPrice: 10 });
  });

  it('reports min and max as numbers when prices differ', () => {
    const group = [
      buildVariant({ base_price: 10 }),
      buildVariant({ base_price: 25 }),
    ];

    const result = getCombinedVariantData(group);

    expect(result.minPrice).toBe(10);
    expect(result.maxPrice).toBe(25);
  });

  it('returns no media when none of the variants have any', () => {
    const group = [buildVariant({ media: null }), buildVariant({ media: null })];

    expect(getCombinedVariantData(group).media).toEqual([]);
  });

  it('collapses repeated media from different variants into one entry', () => {
    const group = [
      buildVariant({ media: { id: 1, url: 'a.jpg' } }),
      buildVariant({ media: { id: 1, url: 'a.jpg' } }),
      buildVariant({ media: { id: 1, url: 'a.jpg' } }),
    ];

    expect(getCombinedVariantData(group).media).toEqual([{ id: 1, url: 'a.jpg' }]);
  });

  it('keeps every distinct media, in first-seen order', () => {
    const group = [
      buildVariant({ media: { id: 1, url: 'a.jpg' } }),
      buildVariant({ media: { id: 2, url: 'b.jpg' } }),
      buildVariant({ media: { id: 1, url: 'a.jpg' } }),
    ];

    expect(getCombinedVariantData(group).media).toEqual([
      { id: 1, url: 'a.jpg' },
      { id: 2, url: 'b.jpg' },
    ]);
  });
});

describe('getSecondaryAttributeCount', () => {
  it('counts attribute values beyond the group value', () => {
    const variant = buildVariant({ attribute_values: [RED, SMALL] });

    expect(getSecondaryAttributeCount(variant, RED)).toBe(1);
  });

  it('is zero when the variant carries only the group value', () => {
    const variant = buildVariant({ attribute_values: [RED] });

    expect(getSecondaryAttributeCount(variant, RED)).toBe(0);
  });
});

describe('getVariantIndexArray', () => {
  it('resolves by id when the variant has one', () => {
    const variants = [
      buildVariant({ id: 1, attribute_values: [RED, SMALL] }),
      buildVariant({ id: 2, attribute_values: [RED, MEDIUM] }),
    ];

    expect(getVariantIndexArray(variants, variants[1])).toEqual([1]);
  });

  it('resolves by attribute-value combination when the variant has no id', () => {
    const variants = [
      buildVariant({ id: 1, attribute_values: [RED, SMALL] }),
      buildVariant({ id: 2, attribute_values: [RED, MEDIUM] }),
    ];
    const unsavedVariant = buildVariant({ attribute_values: [RED, MEDIUM] });

    expect(getVariantIndexArray(variants, unsavedVariant)).toEqual([1]);
  });
});

describe('deriveSelectedCheckedIndexes', () => {
  it('clears the checked indexes when nothing is selected', () => {
    expect(deriveSelectedCheckedIndexes([], 4, 2)).toEqual([]);
  });

  it('checks every row in the group when every variant is selected', () => {
    expect(deriveSelectedCheckedIndexes([0, 1, 2, 3], 4, 2)).toEqual([0, 1]);
  });

  it('leaves the checked indexes unchanged for a partial selection', () => {
    expect(deriveSelectedCheckedIndexes([0, 1], 4, 2)).toBeNull();
  });
});
