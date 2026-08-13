import type { UnitPriceValue } from '@/features/products';
import type { ProductVariant } from '@/features/products';

type BulkEditUpdate = {
  key: string;
  value: unknown;
  variant_index: number[];
};

type SelectionContext = {
  fieldName?: string;
  baseIndex?: number;
};

/**
 * The inclusive index range spanned by two endpoints, regardless of drag
 * direction — used for both a plain multi-cell selection (`start`/`end`)
 * and a fill-handle drag (`baseIndex`/`lastIndex`), which is why it takes
 * two bare indexes rather than a `BulkEditSelectionData` shape.
 */
export const getSelectionRange = (
  start: number | undefined,
  end: number | undefined,
): number[] => {
  if (start === undefined || end === undefined) {
    return [];
  }

  const min = Math.min(start, end);
  const max = Math.max(start, end);
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
};

export const getFillRange = getSelectionRange;

/**
 * `base_price_per_unit` is stored as four separate variant fields; editing
 * it merges the given overrides onto whichever variant the selection is
 * based on, so unedited unit fields survive the write.
 */
export const resolveUnitInfoValue = (
  baseVariant: Partial<UnitPriceValue> | undefined,
  overrides: UnitPriceValue = {},
): UnitPriceValue => ({
  total_unit: baseVariant?.total_unit,
  base_unit: baseVariant?.base_unit,
  total_unit_amount: baseVariant?.total_unit_amount,
  base_unit_amount: baseVariant?.base_unit_amount,
  ...overrides,
});

/**
 * Applies an explicitly typed/picked value across a multi-cell selection
 * (drag-select edit, or a plain single-cell edit with a selection of one).
 */
export const applyValue = (
  variants: ProductVariant[],
  selectionData: SelectionContext,
  variantIndexes: number[],
  fieldName: string,
  value: unknown,
): BulkEditUpdate => {
  if (fieldName === 'base_price_per_unit') {
    return {
      key: 'base_price_per_unit',
      value: resolveUnitInfoValue(
        selectionData.baseIndex !== undefined ? variants[selectionData.baseIndex] : undefined,
        value as UnitPriceValue ?? {},
      ),
      variant_index: variantIndexes,
    };
  }

  return {
    key: fieldName || (selectionData.fieldName ?? ''),
    value,
    variant_index: variantIndexes,
  };
};

/**
 * Copies the base cell's existing value across a fill-drag range — unlike
 * `applyValue`, there is no new input value; the source is read from the
 * variant the drag started on. For `base_price_per_unit`, this re-merges
 * the base variant's own unit fields with no overrides, which is a no-op
 * value-wise but still issues the update — current behavior, not "fixed"
 * here.
 */
export const resolveFillUpdate = (
  variants: ProductVariant[],
  selectionData: SelectionContext,
  variantIndexes: number[],
): BulkEditUpdate => {
  if (selectionData.fieldName === 'base_price_per_unit') {
    return {
      key: 'base_price_per_unit',
      value: resolveUnitInfoValue(
        selectionData.baseIndex !== undefined ? variants[selectionData.baseIndex] : undefined,
      ),
      variant_index: variantIndexes,
    };
  }

  const sourceValue =
    selectionData.baseIndex !== undefined
      ? (variants[selectionData.baseIndex] as unknown as Record<string, unknown>)[selectionData.fieldName ?? '']
      : undefined;

  return {
    key: selectionData.fieldName ?? '',
    value: sourceValue,
    variant_index: variantIndexes,
  };
};
