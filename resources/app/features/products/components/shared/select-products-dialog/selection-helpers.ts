import type {
  ProductPickerItem,
  ProductSelection,
  ProductVariantSelection,
  SelectProductsMode,
} from '@/features/products/components/shared/select-products-dialog/types';

type SelectionMap = Map<number, ProductSelection>;

type SelectionCountsInput = {
  mode: SelectProductsMode;
  items: { selection: ProductSelection }[];
  selectedProductIds: Set<number>;
  selectedVariantIds: Set<number>;
  lockedVariantIds: Set<number>;
};

type SelectionCounts = {
  selectableOnPage: number;
  selectedOnPage: number;
};

const applyProductToggle = (
  selection: SelectionMap,
  product: ProductSelection,
  checked: boolean,
): SelectionMap => {
  const next = new Map(selection);

  if (checked) {
    next.set(product.productId, product);
  } else {
    next.delete(product.productId);
  }

  return next;
};

const applyVariantToggle = (
  selection: SelectionMap,
  product: ProductSelection,
  variants: ProductVariantSelection[],
  checked: boolean,
  lockedVariantIds: Set<number>,
): SelectionMap => {
  const next = new Map(selection);
  const selectedVariantIds = new Set(
    (next.get(product.productId)?.variants ?? []).map((variant) => variant.variantId),
  );

  variants.forEach((variant) => {
    if (lockedVariantIds.has(variant.variantId)) {
      return;
    }

    if (checked) {
      selectedVariantIds.add(variant.variantId);
      return;
    }

    selectedVariantIds.delete(variant.variantId);
  });

  const selectedVariants = product.variants.filter((variant) =>
    selectedVariantIds.has(variant.variantId),
  );

  if (selectedVariants.length === 0) {
    next.delete(product.productId);
    return next;
  }

  next.set(product.productId, { ...product, variants: selectedVariants });

  return next;
};

const getSelectionCounts = ({
  mode,
  items,
  selectedProductIds,
  selectedVariantIds,
  lockedVariantIds,
}: SelectionCountsInput): SelectionCounts => {
  const counts: SelectionCounts = { selectableOnPage: 0, selectedOnPage: 0 };

  items.forEach(({ selection }) => {
    if (mode === 'product') {
      counts.selectableOnPage += 1;
      counts.selectedOnPage += selectedProductIds.has(selection.productId) ? 1 : 0;
      return;
    }

    selection.variants.forEach((variant) => {
      if (lockedVariantIds.has(variant.variantId)) {
        return;
      }

      counts.selectableOnPage += 1;
      counts.selectedOnPage += selectedVariantIds.has(variant.variantId) ? 1 : 0;
    });
  });

  return counts;
};

const getSelectedCount = (
  mode: SelectProductsMode,
  selectedProductIds: Set<number>,
  selectedVariantIds: Set<number>,
  lockedVariantIds: Set<number>,
): number => {
  if (mode === 'product') {
    return selectedProductIds.size;
  }

  let count = 0;

  selectedVariantIds.forEach((variantId) => {
    count += lockedVariantIds.has(variantId) ? 0 : 1;
  });

  return count;
};

const getRowKey = (productId: number, variant?: ProductVariantSelection) =>
  variant ? `variant-${variant.variantId}` : `product-${productId}`;

type PickerRow = {
  pickerItem: ProductPickerItem;
  variant?: ProductVariantSelection;
};

type RangeRowsInput = {
  items: ProductPickerItem[];
  expandedProductIds: Set<number>;
  isOrderMode: boolean;
  anchorKey: string | null;
  target: PickerRow;
};

const getRangeRows = ({
  items,
  expandedProductIds,
  isOrderMode,
  anchorKey,
  target,
}: RangeRowsInput): PickerRow[] => {
  const visibleRows = items.flatMap((pickerItem): PickerRow[] => {
    const variantRows =
      isOrderMode && expandedProductIds.has(pickerItem.product.id)
        ? pickerItem.selection.variants.map((variant) => ({ pickerItem, variant }))
        : [];

    return [{ pickerItem }, ...variantRows];
  });
  const findRowIndex = (key: string | null) =>
    visibleRows.findIndex((row) => getRowKey(row.pickerItem.product.id, row.variant) === key);

  const anchorIndex = findRowIndex(anchorKey);
  const targetIndex = findRowIndex(getRowKey(target.pickerItem.product.id, target.variant));
  const rangeRows =
    anchorIndex === -1 || targetIndex === -1
      ? [target]
      : visibleRows.slice(
          Math.min(anchorIndex, targetIndex),
          Math.max(anchorIndex, targetIndex) + 1,
        );

  return rangeRows.filter((row) => {
    const isExpandedProductRow =
      !row.variant && isOrderMode && expandedProductIds.has(row.pickerItem.product.id);
    const isTargetRow = row.pickerItem === target.pickerItem && row.variant === target.variant;

    return !isExpandedProductRow || isTargetRow;
  });
};

export {
  applyProductToggle,
  applyVariantToggle,
  getRangeRows,
  getRowKey,
  getSelectedCount,
  getSelectionCounts,
  type PickerRow,
};
