import { describe, expect, it } from 'vitest';

import {
  buildCombinations,
  formatComboLabel,
  syncVariantMatrix,
} from '@/pages/products/variant-matrix';
import {
  getDefaultVariantValues,
  type ProductFormVariantInput,
} from '@/schemas/forms/product-form';
import type { Attribute } from '@/types';

const RED = 11;
const BLUE = 12;
const GREEN = 13;
const SMALL = 21;
const MEDIUM = 22;

const color = (...valueIds: number[]): Attribute => ({
  id: 1,
  name: 'Color',
  values: [
    { id: RED, value: 'Red' },
    { id: BLUE, value: 'Blue' },
    { id: GREEN, value: 'Green' },
  ].filter((value) => valueIds.includes(value.id)),
});

const size = (...valueIds: number[]): Attribute => ({
  id: 2,
  name: 'Size',
  values: [
    { id: SMALL, value: 'S' },
    { id: MEDIUM, value: 'M' },
  ].filter((value) => valueIds.includes(value.id)),
});

const variant = (
  overrides: Partial<ProductFormVariantInput>,
): ProductFormVariantInput => ({
  ...getDefaultVariantValues(),
  is_default: false,
  ...overrides,
});

describe('buildCombinations', () => {
  it('produces the cartesian product in attribute then value order', () => {
    const combinations = buildCombinations([
      color(RED, BLUE),
      size(SMALL, MEDIUM),
    ]);

    expect(combinations).toEqual([
      [RED, SMALL],
      [RED, MEDIUM],
      [BLUE, SMALL],
      [BLUE, MEDIUM],
    ]);
  });

  it('produces nine combinations for a three by three grid', () => {
    const combinations = buildCombinations([
      color(RED, BLUE, GREEN),
      { id: 3, name: 'Fit', values: [{ id: 31, value: 'Slim' }, { id: 32, value: 'Regular' }, { id: 33, value: 'Loose' }] },
    ]);

    expect(combinations).toHaveLength(9);
    expect(new Set(combinations.map((combo) => combo.join('-'))).size).toBe(9);
  });

  it('yields a single empty combination when there are no attributes', () => {
    expect(buildCombinations([])).toEqual([[]]);
  });
});

describe('syncVariantMatrix', () => {
  it('preserves saved variants when an attribute is added', () => {
    const previousAttributes = [color(RED, BLUE)];
    const saved = [
      variant({ id: 10, sku: 'ABC', available_quantity: 40, base_price: 20, is_default: true, attribute_values: [RED] }),
      variant({ id: 11, sku: 'XYZ', available_quantity: 12, base_price: 25, attribute_values: [BLUE] }),
    ];

    const { variants, discarded } = syncVariantMatrix({
      attributes: [color(RED, BLUE), size(SMALL, MEDIUM)],
      previousAttributes,
      variants: saved,
    });

    expect(discarded).toEqual([]);
    expect(variants).toHaveLength(4);

    expect(variants[0]).toMatchObject({ id: 10, sku: 'ABC', available_quantity: 40, attribute_values: [RED, SMALL] });
    expect(variants[2]).toMatchObject({ id: 11, sku: 'XYZ', available_quantity: 12, attribute_values: [BLUE, SMALL] });

    expect(variants[1].id).toBeUndefined();
    expect(variants[3].id).toBeUndefined();
    expect(variants[1].attribute_values).toEqual([RED, MEDIUM]);
    expect(variants[3].attribute_values).toEqual([BLUE, MEDIUM]);
  });

  it('keeps the earliest survivor when an attribute is removed', () => {
    const previousAttributes = [color(RED, BLUE), size(SMALL, MEDIUM)];
    const saved = [
      variant({ id: 10, sku: 'ABC', available_quantity: 40, is_default: true, attribute_values: [RED, SMALL] }),
      variant({ id: 11, sku: 'DEF', available_quantity: 25, attribute_values: [RED, MEDIUM] }),
      variant({ id: 12, sku: 'GHI', available_quantity: 12, attribute_values: [BLUE, SMALL] }),
      variant({ id: 13, sku: 'JKL', available_quantity: 8, attribute_values: [BLUE, MEDIUM] }),
    ];

    const { variants, discarded } = syncVariantMatrix({
      attributes: [color(RED, BLUE)],
      previousAttributes,
      variants: saved,
    });

    expect(variants).toHaveLength(2);
    expect(variants[0]).toMatchObject({ id: 10, sku: 'ABC', available_quantity: 40, attribute_values: [RED] });
    expect(variants[1]).toMatchObject({ id: 12, sku: 'GHI', available_quantity: 12, attribute_values: [BLUE] });
    expect(discarded.map((item) => item.id)).toEqual([11, 13]);
  });

  it('adds a value without disturbing existing variants', () => {
    const previousAttributes = [color(RED, BLUE)];
    const saved = [
      variant({ id: 10, sku: 'ABC', is_default: true, attribute_values: [RED] }),
      variant({ id: 11, sku: 'XYZ', attribute_values: [BLUE] }),
    ];

    const { variants, discarded } = syncVariantMatrix({
      attributes: [color(RED, BLUE, GREEN)],
      previousAttributes,
      variants: saved,
    });

    expect(discarded).toEqual([]);
    expect(variants.map((item) => item.id)).toEqual([10, 11, undefined]);
    expect(variants[2].attribute_values).toEqual([GREEN]);
  });

  it('discards only the variants of a removed value', () => {
    const previousAttributes = [color(RED, BLUE, GREEN)];
    const saved = [
      variant({ id: 10, sku: 'ABC', is_default: true, attribute_values: [RED] }),
      variant({ id: 11, sku: 'XYZ', attribute_values: [BLUE] }),
      variant({ id: 12, sku: 'GRN', attribute_values: [GREEN] }),
    ];

    const { variants, discarded } = syncVariantMatrix({
      attributes: [color(RED, BLUE)],
      previousAttributes,
      variants: saved,
    });

    expect(variants.map((item) => item.id)).toEqual([10, 11]);
    expect(variants.map((item) => item.sku)).toEqual(['ABC', 'XYZ']);
    expect(discarded.map((item) => item.id)).toEqual([12]);
  });

  it('preserves every variant when attributes are reordered', () => {
    const previousAttributes = [color(RED, BLUE), size(SMALL, MEDIUM)];
    const saved = [
      variant({ id: 10, is_default: true, attribute_values: [RED, SMALL] }),
      variant({ id: 11, attribute_values: [RED, MEDIUM] }),
      variant({ id: 12, attribute_values: [BLUE, SMALL] }),
      variant({ id: 13, attribute_values: [BLUE, MEDIUM] }),
    ];

    const { variants, discarded } = syncVariantMatrix({
      attributes: [size(SMALL, MEDIUM), color(RED, BLUE)],
      previousAttributes,
      variants: saved,
    });

    expect(discarded).toEqual([]);
    expect(variants).toHaveLength(4);
    expect([...variants.map((item) => item.id)].sort()).toEqual([10, 11, 12, 13]);
    expect(variants[0]).toMatchObject({ id: 10, attribute_values: [SMALL, RED] });
    expect(variants[1]).toMatchObject({ id: 12, attribute_values: [SMALL, BLUE] });
  });

  it('carries a simple product into its first attribute', () => {
    const saved = [
      variant({ id: 10, sku: 'ABC', available_quantity: 40, base_price: 20, is_default: true, attribute_values: [] }),
    ];

    const { variants, discarded } = syncVariantMatrix({
      attributes: [color(RED, BLUE)],
      previousAttributes: [],
      variants: saved,
    });

    expect(discarded).toEqual([]);
    expect(variants[0]).toMatchObject({ id: 10, sku: 'ABC', available_quantity: 40, base_price: 20, attribute_values: [RED] });
    expect(variants[1]).toMatchObject({ id: undefined, sku: null, available_quantity: 0, base_price: 20, attribute_values: [BLUE] });
  });

  it('collapses back to a simple product when the last attribute is removed', () => {
    const previousAttributes = [color(RED, BLUE)];
    const saved = [
      variant({ id: 10, sku: 'ABC', available_quantity: 40, is_default: true, attribute_values: [RED] }),
      variant({ id: 11, sku: 'XYZ', available_quantity: 12, attribute_values: [BLUE] }),
    ];

    const { variants, discarded } = syncVariantMatrix({
      attributes: [],
      previousAttributes,
      variants: saved,
    });

    expect(variants).toHaveLength(1);
    expect(variants[0]).toMatchObject({ id: 10, sku: 'ABC', available_quantity: 40, attribute_values: [] });
    expect(discarded.map((item) => item.id)).toEqual([11]);
  });

  it('inherits pricing and media into a generated variant', () => {
    const saved = [
      variant({ id: 10, base_price: 20, base_sale_price: 15, media: 7, weight: 0.5, is_default: true, attribute_values: [RED] }),
    ];

    const { variants } = syncVariantMatrix({
      attributes: [color(RED, BLUE)],
      previousAttributes: [color(RED)],
      variants: saved,
    });

    expect(variants[1]).toMatchObject({ base_price: 20, base_sale_price: 15, media: 7, weight: 0.5 });
  });

  it('does not inherit identity or stock into a generated variant', () => {
    const saved = [
      variant({ id: 10, sku: 'ABC', barcode: '5901234', available_quantity: 40, committed_quantity: 3, is_default: true, attribute_values: [RED] }),
    ];

    const { variants } = syncVariantMatrix({
      attributes: [color(RED, BLUE)],
      previousAttributes: [color(RED)],
      variants: saved,
    });

    expect(variants[1]).toMatchObject({
      id: undefined,
      sku: null,
      barcode: null,
      available_quantity: 0,
      committed_quantity: 0,
      is_default: false,
    });
  });

  it('never repeats a sku across a generated grid', () => {
    const saved = [
      variant({ id: 10, sku: 'ABC', is_default: true, attribute_values: [] }),
    ];

    const { variants } = syncVariantMatrix({
      attributes: [color(RED, BLUE, GREEN), size(SMALL, MEDIUM)],
      previousAttributes: [],
      variants: saved,
    });

    expect(variants).toHaveLength(6);

    const skus = variants.map((item) => item.sku).filter(Boolean);
    expect(skus).toEqual(['ABC']);
  });

  it('keeps the surviving default variant', () => {
    const saved = [
      variant({ id: 10, attribute_values: [RED] }),
      variant({ id: 11, is_default: true, attribute_values: [BLUE] }),
    ];

    const { variants } = syncVariantMatrix({
      attributes: [color(RED, BLUE), size(SMALL, MEDIUM)],
      previousAttributes: [color(RED, BLUE)],
      variants: saved,
    });

    expect(variants.filter((item) => item.is_default).map((item) => item.id)).toEqual([11]);
  });

  it('promotes the first variant when the default is discarded', () => {
    const saved = [
      variant({ id: 10, attribute_values: [RED] }),
      variant({ id: 11, is_default: true, attribute_values: [GREEN] }),
    ];

    const { variants, discarded } = syncVariantMatrix({
      attributes: [color(RED, BLUE)],
      previousAttributes: [color(RED, BLUE, GREEN)],
      variants: saved,
    });

    expect(discarded.map((item) => item.id)).toEqual([11]);
    expect(variants.filter((item) => item.is_default)).toHaveLength(1);
    expect(variants[0].is_default).toBe(true);
  });

  it('collapses several defaults down to one', () => {
    const saved = [
      variant({ id: 10, is_default: true, attribute_values: [RED] }),
      variant({ id: 11, is_default: true, attribute_values: [BLUE] }),
    ];

    const { variants } = syncVariantMatrix({
      attributes: [color(RED, BLUE)],
      previousAttributes: [color(RED, BLUE)],
      variants: saved,
    });

    expect(variants.map((item) => item.is_default)).toEqual([true, false]);
  });
});

describe('formatComboLabel', () => {
  it('orders values by the attribute list, not by the value array', () => {
    const attributes = [color(RED, BLUE), size(SMALL, MEDIUM)];

    expect(formatComboLabel(attributes, [MEDIUM, RED])).toBe('Red / M');
  });

  it('returns an empty label for a simple product', () => {
    expect(formatComboLabel([], [])).toBe('');
  });
});
