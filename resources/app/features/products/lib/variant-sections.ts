/**
 * Price/inventory/shipping are single-value fields when a product has no
 * variants, or has variants but none of them carry attribute values yet
 * (mid-setup). Once attribute values exist, those fields move to the
 * per-variant table instead.
 */
export const shouldShowSimpleVariantSections = (
  hasVariants: boolean | undefined,
  attributeValues: number[] | undefined,
): boolean =>
  !hasVariants ||
  !attributeValues ||
  (Array.isArray(attributeValues) && attributeValues.length === 0);
