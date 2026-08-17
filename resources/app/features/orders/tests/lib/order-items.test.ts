import { describe, expect, it } from 'vitest';

import {
  flattenSelections,
  getDisplayByVariantId,
  getOrderRows,
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
      { variantId: 101, variantLabel: 'S', thumbnail: null, inStock: true, regularPrice: money(10), salePrice: null, productId: 1, productTitle: 'Shirt' },
      { variantId: 102, variantLabel: 'M', thumbnail: null, inStock: true, regularPrice: money(10), salePrice: null, productId: 1, productTitle: 'Shirt' },
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
