import { describe, expect, it } from 'vitest';

import {
  flattenSelections,
  getDisplayByVariantId,
  getMaxQuantity,
  getOrderRows,
  getQuantityLimit,
  mergeSelections,
  type PickedItem,
} from '@/features/orders/lib/order-items';
import type { ProductSelection, ProductVariantSelection } from '@/features/products';
import type { MoneyObject } from '@/schemas/shared/api';

const money = (raw: number): MoneyObject => ({
  raw,
  display: `$${raw}`,
  currency: { code: 'USD', symbol: '$' },
});

const productVariant = (
  overrides: Partial<ProductVariantSelection>,
): ProductVariantSelection => ({
  variantId: 1,
  variantLabel: 'Default',
  thumbnail: null,
  inStock: true,
  availableQuantity: 10,
  allowBackOrder: false,
  trackInventory: true,
  hasLimitPerOrder: false,
  maxPerOrder: null,
  regularPrice: money(10),
  salePrice: null,
  ...overrides,
});

const product = (overrides: Partial<ProductSelection>): ProductSelection => ({
  productId: 1,
  productTitle: 'Product',
  thumbnail: null,
  inStock: true,
  regularPrice: money(10),
  salePrice: null,
  variants: [productVariant({})],
  ...overrides,
});

describe('flattenSelections', () => {
  it('flattens each product into one row per variant, carrying the product id and title', () => {
    const selections: ProductSelection[] = [
      product({
        productId: 1,
        productTitle: 'Shirt',
        variants: [
          productVariant({ variantId: 101, variantLabel: 'S' }),
          productVariant({ variantId: 102, variantLabel: 'M' }),
        ],
      }),
    ];

    expect(flattenSelections(selections)).toEqual([
      { ...productVariant({ variantId: 101, variantLabel: 'S' }), productId: 1, productTitle: 'Shirt' },
      { ...productVariant({ variantId: 102, variantLabel: 'M' }), productId: 1, productTitle: 'Shirt' },
    ]);
  });
});

describe('getDisplayByVariantId', () => {
  it('indexes flattened rows by variant id', () => {
    const selections: ProductSelection[] = [
      product({ productId: 1, variants: [productVariant({ variantId: 101 })] }),
    ];

    const result = getDisplayByVariantId(selections);

    expect(Object.keys(result)).toEqual(['101']);
    expect(result[101].productId).toBe(1);
  });
});

describe('getOrderRows', () => {
  it('joins picked items with their display data, preserving picked-item order', () => {
    const displayByVariantId = getDisplayByVariantId([
      product({
        productId: 1,
        variants: [
          productVariant({ variantId: 101, variantLabel: 'S' }),
          productVariant({ variantId: 102, variantLabel: 'M' }),
        ],
      }),
    ]);
    const pickedItems: PickedItem[] = [
      { variant_id: 102, quantity: 3 },
      { variant_id: 101, quantity: 1 },
    ];

    const rows = getOrderRows(pickedItems, displayByVariantId);

    expect(rows).toEqual([
      { index: 0, quantity: 3, display: displayByVariantId[102] },
      { index: 1, quantity: 1, display: displayByVariantId[101] },
    ]);
  });

  it('drops a picked item with no matching display data', () => {
    const displayByVariantId = getDisplayByVariantId([
      product({ productId: 1, variants: [productVariant({ variantId: 101 })] }),
    ]);
    const pickedItems: PickedItem[] = [{ variant_id: 999, quantity: 1 }];

    expect(getOrderRows(pickedItems, displayByVariantId)).toEqual([]);
  });
});

describe('mergeSelections', () => {
  it('adds newly selected variants at quantity 1', () => {
    const result = mergeSelections(
      [],
      [product({ productId: 1, variants: [productVariant({ variantId: 101 })] })],
    );

    expect(result).toEqual([{ variant_id: 101, quantity: 1 }]);
  });

  it('preserves the existing quantity when a variant is still selected', () => {
    const pickedItems: PickedItem[] = [{ variant_id: 101, quantity: 5 }];

    const result = mergeSelections(
      pickedItems,
      [product({ productId: 1, variants: [productVariant({ variantId: 101 })] })],
    );

    expect(result).toEqual([{ variant_id: 101, quantity: 5 }]);
  });

  it('drops a variant that is no longer among the selections', () => {
    const pickedItems: PickedItem[] = [
      { variant_id: 101, quantity: 5 },
      { variant_id: 102, quantity: 2 },
    ];

    const result = mergeSelections(
      pickedItems,
      [product({ productId: 1, variants: [productVariant({ variantId: 101 })] })],
    );

    expect(result).toEqual([{ variant_id: 101, quantity: 5 }]);
  });

  it('returns an empty array when the selection is emptied out', () => {
    const pickedItems: PickedItem[] = [{ variant_id: 101, quantity: 5 }];

    expect(mergeSelections(pickedItems, [])).toEqual([]);
  });
});

describe('getMaxQuantity', () => {
  it('caps at available stock when inventory is tracked and backorder is not allowed', () => {
    const display = flattenSelections([
      product({ variants: [productVariant({ availableQuantity: 4, trackInventory: true, allowBackOrder: false })] }),
    ])[0];

    expect(getMaxQuantity(display)).toBe(4);
  });

  it('is uncapped when the variant is backorder-eligible, even with a stock figure on record', () => {
    const display = flattenSelections([
      product({ variants: [productVariant({ availableQuantity: 4, trackInventory: true, allowBackOrder: true })] }),
    ])[0];

    expect(getMaxQuantity(display)).toBeUndefined();
  });

  it('is uncapped when inventory is not tracked at all', () => {
    const display = flattenSelections([
      product({ variants: [productVariant({ availableQuantity: 4, trackInventory: false, allowBackOrder: false })] }),
    ])[0];

    expect(getMaxQuantity(display)).toBeUndefined();
  });

  it('caps at the per-order limit independent of stock', () => {
    const display = flattenSelections([
      product({
        variants: [
          productVariant({
            availableQuantity: 100,
            trackInventory: true,
            allowBackOrder: false,
            hasLimitPerOrder: true,
            maxPerOrder: 3,
          }),
        ],
      }),
    ])[0];

    expect(getMaxQuantity(display)).toBe(3);
  });

  it('uses the stricter of the two ceilings when both a stock limit and a per-order limit apply', () => {
    const display = flattenSelections([
      product({
        variants: [
          productVariant({
            availableQuantity: 2,
            trackInventory: true,
            allowBackOrder: false,
            hasLimitPerOrder: true,
            maxPerOrder: 5,
          }),
        ],
      }),
    ])[0];

    expect(getMaxQuantity(display)).toBe(2);
  });
});

/**
 * `sprintf` is the identity-ish fallback from `@/wpi18n` here (no
 * `window.wp.i18n` in the test environment: it just joins the format string
 * and its args with spaces), so these assert the terms that reach the
 * message rather than the assembled sentence.
 */
describe('getQuantityLimit', () => {
  it('reports a stock-left reason when only the stock ceiling applies', () => {
    const display = flattenSelections([
      product({ variants: [productVariant({ availableQuantity: 4, trackInventory: true, allowBackOrder: false })] }),
    ])[0];

    const result = getQuantityLimit(display);
    expect(result?.max).toBe(4);
    expect(result?.reason).toContain('stock');
    expect(result?.reason).toContain('4');
  });

  it('reports a per-order reason when only the per-order limit applies', () => {
    const display = flattenSelections([
      product({
        variants: [
          productVariant({
            availableQuantity: 100,
            trackInventory: true,
            allowBackOrder: false,
            hasLimitPerOrder: true,
            maxPerOrder: 3,
          }),
        ],
      }),
    ])[0];

    const result = getQuantityLimit(display);
    expect(result?.max).toBe(3);
    expect(result?.reason).toContain('per order');
    expect(result?.reason).toContain('3');
  });

  it('reports the stock reason when both ceilings apply and stock is the stricter (or tied) one', () => {
    const display = flattenSelections([
      product({
        variants: [
          productVariant({
            availableQuantity: 2,
            trackInventory: true,
            allowBackOrder: false,
            hasLimitPerOrder: true,
            maxPerOrder: 5,
          }),
        ],
      }),
    ])[0];

    const result = getQuantityLimit(display);
    expect(result?.max).toBe(2);
    expect(result?.reason).toContain('stock');
  });

  it('reports the per-order reason when both ceilings apply and the per-order limit is stricter', () => {
    const display = flattenSelections([
      product({
        variants: [
          productVariant({
            availableQuantity: 10,
            trackInventory: true,
            allowBackOrder: false,
            hasLimitPerOrder: true,
            maxPerOrder: 3,
          }),
        ],
      }),
    ])[0];

    const result = getQuantityLimit(display);
    expect(result?.max).toBe(3);
    expect(result?.reason).toContain('per order');
  });

  it('returns undefined when neither ceiling applies', () => {
    const display = flattenSelections([
      product({ variants: [productVariant({ trackInventory: false, allowBackOrder: true, hasLimitPerOrder: false })] }),
    ])[0];

    expect(getQuantityLimit(display)).toBeUndefined();
  });
});
