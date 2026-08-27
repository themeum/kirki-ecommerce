import { generateVariantIndexById, generateVariantIndexes } from '@/features/products/lib/utils';
import type { ProductVariant } from '@/features/products/schemas/catalog/variant';
import type { MediaRef } from '@/schemas/shared/media';

export type CombinedVariantData = {
  minPrice: number;
  maxPrice: number;
  media: MediaRef[];
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
 * collapsed: the min/max price across the group, and every distinct media
 * (deduped by id, in first-seen order) so the caller can decide between a
 * flat thumbnail and a stack.
 */
export const getCombinedVariantData = (
  groupVariants: ProductVariant[],
): CombinedVariantData => {
  let minPrice = Number(groupVariants[0]?.base_price ?? 0);
  let maxPrice = Number(groupVariants[0]?.base_price ?? 0);
  const media: MediaRef[] = [];
  const seenMediaIds = new Set<string>();

  groupVariants.forEach((item) => {
    const price = Number(item?.base_price);
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);

    if (!item?.media) {
      return;
    }

    const mediaId = String(item.media.id);

    if (!seenMediaIds.has(mediaId)) {
      seenMediaIds.add(mediaId);
      media.push(item.media);
    }
  });

  return { minPrice, maxPrice, media };
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
