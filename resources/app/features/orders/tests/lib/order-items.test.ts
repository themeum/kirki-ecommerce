import { describe, expect, it } from 'vitest';

import {
  flattenSelections,
  getMaxQuantity,
  getOrderRows,
  getQuantityLimit,
  mergeSelections,
  pairCalculationItems,
  type PickedItem,
  toQuantityLimitSource,
  toStoredRowDisplay,
} from '@/features/orders/lib/order-items';
import type {
  OrderCalculationItem,
  OrderEditLineItem,
} from '@/features/orders/schemas/catalog/order';
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

const calculationItem = (overrides: Partial<OrderCalculationItem>): OrderCalculationItem => ({
  id: null,
  is_reachable: true,
  quantity: 1,
  base_subtotal_money_object: money(10),
  base_unit_price_money_object: money(10),
  applied_product_coupons: [],
  ...overrides,
});

const lineItem = (overrides: Partial<OrderEditLineItem>): OrderEditLineItem => ({
  is_reachable: true,
  allow_back_order: false,
  track_inventory: true,
  available_quantity: 6,
  in_stock: true,
  has_limit_per_order: false,
  max_per_order: null,
  id: 7,
  product_id: 3,
  variant_id: 12,
  product_name: 'Shirt',
  variant_name: 'Red',
  quantity: 4,
  invoiced_subtotal_money_object: money(40),
  base_subtotal_money_object: money(40),
  invoiced_unit_price_money_object: money(10),
  base_unit_price_money_object: money(10),
  invoiced_tax_total_money_object: money(0),
  base_tax_total_money_object: money(0),
  tax_lines: [],
  applied_product_coupons: [],
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

describe('getOrderRows', () => {
  const selections: ProductSelection[] = [
    product({
      productId: 1,
      variants: [
        productVariant({ variantId: 101, variantLabel: 'S' }),
        productVariant({ variantId: 102, variantLabel: 'M' }),
      ],
    }),
  ];
  const [display101, display102] = flattenSelections(selections);

  it('joins picked items with their display data, preserving picked-item order', () => {
    const pickedItems: PickedItem[] = [
      { variant_id: 102, quantity: 3 },
      { variant_id: 101, quantity: 1 },
    ];

    expect(getOrderRows(pickedItems, selections, [])).toEqual([
      { index: 0, quantity: 3, display: display102 },
      { index: 1, quantity: 1, display: display101 },
    ]);
  });

  it('drops a picked item with no matching display data', () => {
    const pickedItems: PickedItem[] = [{ variant_id: 999, quantity: 1 }];

    expect(getOrderRows(pickedItems, selections, [])).toEqual([]);
  });

  it('prefers the picker display over the stored line for the same variant', () => {
    const pickedItems: PickedItem[] = [{ id: 7, variant_id: 101, quantity: 2 }];

    expect(getOrderRows(pickedItems, selections, [lineItem({ id: 7, variant_id: 101 })])).toEqual([
      { index: 0, quantity: 2, display: display101 },
    ]);
  });

  it('falls back to the stored line by id when the variant was deleted', () => {
    const storedItem = lineItem({ id: 7, product_id: null, variant_id: null });
    const pickedItems: PickedItem[] = [{ id: 7, variant_id: null, quantity: 4 }];

    expect(getOrderRows(pickedItems, selections, [storedItem])).toEqual([
      { index: 0, quantity: 4, display: toStoredRowDisplay(storedItem) },
    ]);
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

describe('getQuantityLimit from a calculation item', () => {
  const limitOf = (overrides: Partial<OrderCalculationItem>, storedQuantity?: number) =>
    getQuantityLimit(toQuantityLimitSource(calculationItem(overrides)), storedQuantity);

  it('caps at available stock when inventory is tracked and back orders are not allowed', () => {
    expect(
      limitOf({ track_inventory: true, allow_back_order: false, available_quantity: 3 })?.max,
    ).toBe(3);
  });

  it('is uncapped when back orders are allowed', () => {
    expect(
      limitOf({ track_inventory: true, allow_back_order: true, available_quantity: 3 }),
    ).toBeUndefined();
  });

  it('is uncapped when inventory is not tracked', () => {
    expect(
      limitOf({ track_inventory: false, allow_back_order: false, available_quantity: 3 }),
    ).toBeUndefined();
  });

  it('caps at the per-order limit when the variant has one', () => {
    expect(
      limitOf({ track_inventory: false, has_limit_per_order: true, max_per_order: 2 })?.max,
    ).toBe(2);
  });

  it('ignores a per-order maximum when the variant has no limit', () => {
    expect(limitOf({ has_limit_per_order: false, max_per_order: 2 })).toBeUndefined();
  });

  it('uses the smaller ceiling when stock and the per-order limit both apply', () => {
    expect(
      limitOf({
        track_inventory: true,
        allow_back_order: false,
        available_quantity: 5,
        has_limit_per_order: true,
        max_per_order: 3,
      })?.max,
    ).toBe(3);
  });

  it('keeps the stored quantity as the ceiling when the limit is now lower', () => {
    expect(limitOf({ has_limit_per_order: true, max_per_order: 2 }, 4)?.max).toBe(4);
  });

  it('keeps the stored quantity as the ceiling for a sold-out stored line', () => {
    expect(
      limitOf({ track_inventory: true, allow_back_order: false, available_quantity: 0 }, 5)?.max,
    ).toBe(5);
  });

  it('keeps the limit when the stored quantity is below it', () => {
    expect(limitOf({ has_limit_per_order: true, max_per_order: 5 }, 4)?.max).toBe(5);
  });

  it('stays uncapped for a stored line when no ceiling applies', () => {
    expect(limitOf({}, 4)).toBeUndefined();
  });
});

describe('toStoredRowDisplay', () => {
  it('reads the name, label, image and prices stored on the line', () => {
    const display = toStoredRowDisplay(
      lineItem({
        image: { id: 1, url: 'https://example.com/shirt.jpg' },
        base_unit_price_money_object: money(8),
        base_unit_strikethrough_price_money_object: money(10),
      }),
    );

    expect(display).toMatchObject({
      productId: 3,
      productTitle: 'Shirt',
      variantId: 12,
      variantLabel: 'Red',
      thumbnail: 'https://example.com/shirt.jpg',
      regularPrice: money(10),
      salePrice: money(8),
      storedQuantity: 4,
    });
  });

  it('has no sale price when the line has no strikethrough price', () => {
    const display = toStoredRowDisplay(lineItem({}));

    expect(display.regularPrice).toEqual(money(10));
    expect(display.salePrice).toBeNull();
  });

  it('reads the live stock, limit and reachability values of the edit read', () => {
    const display = toStoredRowDisplay(
      lineItem({
        allow_back_order: false,
        track_inventory: true,
        available_quantity: 6,
        in_stock: true,
        has_limit_per_order: true,
        max_per_order: 3,
        is_reachable: true,
      }),
    );

    expect(display).toMatchObject({
      allowBackOrder: false,
      trackInventory: true,
      availableQuantity: 6,
      inStock: true,
      hasLimitPerOrder: true,
      maxPerOrder: 3,
      isReachable: true,
      storedSubtotal: money(40),
    });
    expect(getQuantityLimit(display, display.storedQuantity)?.max).toBe(4);
  });

  it('floors the ceiling at the stored quantity for a sold-out variant', () => {
    const display = toStoredRowDisplay(
      lineItem({ quantity: 5, available_quantity: 0, in_stock: false }),
    );

    expect(getQuantityLimit(display, display.storedQuantity)?.max).toBe(5);
  });

  it('falls back to permissive values and marks the line unreachable when the variant was deleted', () => {
    const display = toStoredRowDisplay(
      lineItem({
        is_reachable: false,
        allow_back_order: null,
        track_inventory: null,
        available_quantity: null,
        in_stock: null,
        has_limit_per_order: null,
        max_per_order: null,
      }),
    );

    expect(display).toMatchObject({
      inStock: true,
      availableQuantity: 0,
      allowBackOrder: true,
      trackInventory: false,
      hasLimitPerOrder: false,
      maxPerOrder: null,
      isReachable: false,
    });
    expect(getQuantityLimit(display, display.storedQuantity)).toBeUndefined();
  });
});

describe('mergeSelections with stored lines', () => {
  it('keeps a stored line and its id although the picker does not hold it', () => {
    const pickedItems: PickedItem[] = [{ id: 7, variant_id: 12, quantity: 4 }];

    const result = mergeSelections(
      pickedItems,
      [product({ productId: 1, variants: [productVariant({ variantId: 101 })] })],
    );

    expect(result).toEqual([
      { id: 7, variant_id: 12, quantity: 4 },
      { variant_id: 101, quantity: 1 },
    ]);
  });
});

describe('pairCalculationItems', () => {
  it('pairs stored lines by id and new lines by their order', () => {
    const pickedItems: PickedItem[] = [
      { id: 7, variant_id: 12, quantity: 2 },
      { variant_id: 101, quantity: 1 },
      { id: 9, variant_id: 13, quantity: 1 },
      { variant_id: 102, quantity: 3 },
    ];
    const items = [
      calculationItem({ id: 9, quantity: 1 }),
      calculationItem({ id: 7, quantity: 2 }),
      calculationItem({ id: null, quantity: 11 }),
      calculationItem({ id: null, quantity: 12 }),
    ];

    const result = pairCalculationItems(pickedItems, items);

    expect(result.map((item) => item?.id ?? item?.quantity)).toEqual([7, 11, 9, 12]);
  });

  it('keeps the data on the right lines after a stored line in the middle is removed', () => {
    const pickedItems: PickedItem[] = [
      { id: 7, variant_id: 12, quantity: 2 },
      { id: 11, variant_id: 14, quantity: 1 },
    ];
    const items = [calculationItem({ id: 7 }), calculationItem({ id: 11 })];

    expect(pairCalculationItems(pickedItems, items).map((item) => item?.id)).toEqual([7, 11]);
  });

  it('leaves a line without a calculation item undefined', () => {
    expect(pairCalculationItems([{ id: 7, variant_id: 12, quantity: 2 }], [])).toEqual([
      undefined,
    ]);
  });

  it('pairs by position when no line has an id, as in create', () => {
    const items = [calculationItem({ quantity: 1 }), calculationItem({ quantity: 2 })];
    const pickedItems: PickedItem[] = [
      { variant_id: 101, quantity: 1 },
      { variant_id: 102, quantity: 2 },
    ];

    expect(pairCalculationItems(pickedItems, items)).toEqual(items);
  });
});

describe('getQuantityLimit out-of-stock reason', () => {
  it('says out of stock when the variant is not in stock', () => {
    const result = getQuantityLimit(
      toQuantityLimitSource(
        calculationItem({
          in_stock: false,
          track_inventory: true,
          allow_back_order: false,
          available_quantity: 0,
        }),
      ),
    );

    expect(result?.max).toBe(0);
    expect(result?.reason).toContain('Out of stock');
  });

  it('keeps the left-in-stock reason when the variant is in stock', () => {
    const result = getQuantityLimit(
      toQuantityLimitSource(
        calculationItem({
          in_stock: true,
          track_inventory: true,
          allow_back_order: false,
          available_quantity: 3,
        }),
      ),
    );

    expect(result?.reason).toContain('stock');
    expect(result?.reason).not.toContain('Out of stock');
  });
});
