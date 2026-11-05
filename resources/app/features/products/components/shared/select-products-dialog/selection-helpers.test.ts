import { describe, expect, it } from 'vitest';

import {
  applyProductToggle,
  applyVariantToggle,
  getRangeRows,
  getRowKey,
  getSelectedCount,
  getSelectionCounts,
  type PickerRow,
} from '@/features/products/components/shared/select-products-dialog/selection-helpers';
import type {
  ProductPickerItem,
  ProductSelection,
} from '@/features/products/components/shared/select-products-dialog/types';

const buildProduct = (id: number, variantIds: number[]) =>
  ({
    productId: id,
    productTitle: `Product ${id}`,
    variants: variantIds.map((variantId) => ({ variantId, variantLabel: `Variant ${variantId}` })),
  }) as unknown as ProductSelection;

const productOne = buildProduct(1, [10, 11, 12]);
const productTwo = buildProduct(2, [20, 21]);
const noLocked = new Set<number>();

const variantIdsOf = (selection: Map<number, ProductSelection>, productId: number) =>
  selection.get(productId)?.variants.map((variant) => variant.variantId);

describe('applyProductToggle', () => {
  it('adds and removes a whole product', () => {
    const added = applyProductToggle(new Map(), productOne, true);

    expect(added.get(1)).toBe(productOne);
    expect(applyProductToggle(added, productOne, false).has(1)).toBe(false);
  });
});

describe('applyVariantToggle', () => {
  it('selects only the given variants', () => {
    const next = applyVariantToggle(
      new Map(),
      productOne,
      [productOne.variants[1]],
      true,
      noLocked,
    );

    expect(variantIdsOf(next, 1)).toEqual([11]);
  });

  it('removes the product when its last variant is deselected', () => {
    const selected = applyVariantToggle(
      new Map(),
      productOne,
      [productOne.variants[0]],
      true,
      noLocked,
    );
    const next = applyVariantToggle(
      selected,
      productOne,
      [productOne.variants[0]],
      false,
      noLocked,
    );

    expect(next.has(1)).toBe(false);
  });

  it('does not deselect a locked variant', () => {
    const initial = new Map([[1, buildProduct(1, [10, 11])]]);
    const next = applyVariantToggle(initial, productOne, productOne.variants, false, new Set([10]));

    expect(variantIdsOf(next, 1)).toEqual([10]);
  });

  it('keeps a product that only has locked variants when deselecting', () => {
    const initial = new Map([[2, productTwo]]);
    const next = applyVariantToggle(
      initial,
      productTwo,
      productTwo.variants,
      false,
      new Set([20, 21]),
    );

    expect(variantIdsOf(next, 2)).toEqual([20, 21]);
  });

  it('selects unlocked variants and keeps locked ones', () => {
    const initial = new Map([[1, buildProduct(1, [10])]]);
    const next = applyVariantToggle(initial, productOne, productOne.variants, true, new Set([10]));

    expect(variantIdsOf(next, 1)).toEqual([10, 11, 12]);
  });

  it('does not add a locked variant that is missing from the selection', () => {
    const next = applyVariantToggle(
      new Map(),
      productOne,
      [productOne.variants[0]],
      true,
      new Set([10]),
    );

    expect(next.has(1)).toBe(false);
  });
});

describe('getSelectionCounts', () => {
  const items = [{ selection: productOne }, { selection: productTwo }];

  it('counts products in product mode', () => {
    const counts = getSelectionCounts({
      mode: 'product',
      items,
      selectedProductIds: new Set([1]),
      selectedVariantIds: new Set(),
      lockedVariantIds: noLocked,
    });

    expect(counts).toEqual({ selectableOnPage: 2, selectedOnPage: 1 });
  });

  it('counts variants in order mode', () => {
    const counts = getSelectionCounts({
      mode: 'order',
      items,
      selectedProductIds: new Set(),
      selectedVariantIds: new Set([10, 20]),
      lockedVariantIds: noLocked,
    });

    expect(counts).toEqual({ selectableOnPage: 5, selectedOnPage: 2 });
  });

  it('excludes locked variants in order mode', () => {
    const counts = getSelectionCounts({
      mode: 'order',
      items,
      selectedProductIds: new Set(),
      selectedVariantIds: new Set([10, 11, 20]),
      lockedVariantIds: new Set([10, 20, 21]),
    });

    expect(counts).toEqual({ selectableOnPage: 2, selectedOnPage: 1 });
  });

  it('reports nothing selectable when every variant is locked', () => {
    const counts = getSelectionCounts({
      mode: 'order',
      items: [{ selection: productTwo }],
      selectedProductIds: new Set(),
      selectedVariantIds: new Set([20, 21]),
      lockedVariantIds: new Set([20, 21]),
    });

    expect(counts).toEqual({ selectableOnPage: 0, selectedOnPage: 0 });
  });
});

describe('getSelectedCount', () => {
  it('counts selected products in product mode', () => {
    expect(getSelectedCount('product', new Set([1, 2]), new Set([10]), noLocked)).toBe(2);
  });

  it('counts only variants that are not locked in order mode', () => {
    expect(getSelectedCount('order', new Set(), new Set([10, 11, 20]), new Set([10, 20]))).toBe(1);
  });
});

describe('getRangeRows', () => {
  const items = [productOne, productTwo].map((selection) => ({
    product: { id: selection.productId },
    selection,
  })) as unknown as ProductPickerItem[];
  const expanded = new Set([1, 2]);
  const describeRows = (rows: PickerRow[]) =>
    rows.map((row) => getRowKey(row.pickerItem.product.id, row.variant));

  it('returns only the target when there is no anchor', () => {
    const rows = getRangeRows({
      items,
      expandedProductIds: expanded,
      isOrderMode: true,
      anchorKey: null,
      target: { pickerItem: items[1] },
    });

    expect(describeRows(rows)).toEqual(['product-2']);
  });

  it('spans variant rows and skips expanded product rows that are not the target', () => {
    const rows = getRangeRows({
      items,
      expandedProductIds: expanded,
      isOrderMode: true,
      anchorKey: 'variant-11',
      target: { pickerItem: items[1], variant: items[1].selection.variants[0] },
    });

    expect(describeRows(rows)).toEqual(['variant-11', 'variant-12', 'variant-20']);
  });

  it('spans product rows in product mode', () => {
    const rows = getRangeRows({
      items,
      expandedProductIds: expanded,
      isOrderMode: false,
      anchorKey: 'product-1',
      target: { pickerItem: items[1] },
    });

    expect(describeRows(rows)).toEqual(['product-1', 'product-2']);
  });
});
