import { generateVariantIndexById, generateVariantIndexes } from '@/features/products/lib/utils';
import type { ProductVariant } from '@/features/products/schemas/catalog/variant';

export type CombinedVariantData = {
  base_price?: number | string | null;
  in_stock?: boolean | string;
  available_quantity?: number;
  media?: ({ url?: string; [key: string]: unknown } | null | undefined)[];
};

/**
 * The variants belonging to one attribute-value group (e.g. all variants
 * tagged "Red"), in the order they appear in the product's variant list.
 */
export const getGroupVariants = (
  variants: ProductVariant[],
  parentId: number,
): ProductVariant[] => variants.filter((variant) => variant.attribute_values?.includes(parentId));

/**
 * Rolls up a group's variants into the single row shown when the group is
 * collapsed: a price range (or one price, if they match), a consensus
 * in-stock status (`' '` when the variants disagree), a summed available
 * quantity, and up to two thumbnails.
 */
export const getCombinedVariantData = (
  groupVariants: ProductVariant[],
): CombinedVariantData => {
  let minPrice = groupVariants[0]?.base_price;
  let maxPrice = groupVariants[0]?.base_price;
  let inStock: boolean | string | undefined = groupVariants[0]?.in_stock;
  let availableQuantity = 0;
  let mediaArray: CombinedVariantData['media'] = [groupVariants[0]?.media];

  groupVariants.forEach((item) => {
    minPrice = Number(Math.min(Number(minPrice), Number(item?.base_price)));
    maxPrice = Number(Math.max(Number(maxPrice), Number(item?.base_price)));
    inStock = item?.in_stock !== inStock ? ' ' : inStock;
    availableQuantity += Number(item?.available_quantity);
    mediaArray =
      item?.media && (mediaArray?.length ?? 0) < 2
        ? [...(mediaArray ?? []), item.media]
        : mediaArray;
  });

  return {
    base_price: minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`,
    in_stock: inStock,
    available_quantity: availableQuantity,
    media: mediaArray,
  };
};

/**
 * How many attribute values a group's representative variant carries beyond
 * the group's own attribute value — non-zero means the group still varies
 * by a second attribute (e.g. "Red" further split by size).
 */
export const getSecondaryAttributeCount = (
  representativeVariant: ProductVariant,
  parentId: number,
): number =>
  representativeVariant.attribute_values.filter((value) => value !== parentId).length;

/**
 * The indexes, within the full product variant list, that a single
 * row's checkbox/edit action should apply to.
 */
export const getVariantIndexArray = (
  variants: ProductVariant[],
  variant: ProductVariant,
): number[] =>
  variant.id
    ? generateVariantIndexById(variants, variant.id)
    : generateVariantIndexes(variants, variant.attribute_values);

/**
 * The child checkbox selection implied by the parent-level `selectedIndex`
 * set: fully cleared when nothing is selected, fully checked when every
 * variant is selected, and left unchanged (`null`) for any partial
 * selection — mirrors the effect that only reacts to the "all" and "none"
 * edges, not to indeterminate ones.
 */
export const deriveSelectedCheckedIndexes = (
  selectedIndex: number[],
  totalVariantsCount: number,
  groupVariantsCount: number,
): number[] | null => {
  if (selectedIndex.length === 0) {
    return [];
  }

  if (selectedIndex.length === totalVariantsCount) {
    return Array.from({ length: groupVariantsCount }, (_, index) => index);
  }

  return null;
};
