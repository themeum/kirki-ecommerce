import type { Attribute, AttributeValue } from '@/features/products/schemas/catalog/attribute';
import type { ProductVariant } from '@/features/products/schemas/catalog/variant';
export const getAttributeById = (
  attributes: Attribute[],
  id: number,
): Attribute | undefined => {
  return attributes.find((attr) => attr.id === id);
};

export const getAttributeByValueId = (
  attributes: Attribute[],
  valueId: number,
): AttributeValue | null => {
  for (const attr of attributes) {
    for (const value of attr.values ?? []) {
      if (value.id === valueId) {
        return value;
      }
    }
  }

  return null;
};

export const generateVariantIndexes = (
  variants: ProductVariant[],
  arr: number[],
): number[] => {
  const variant_indexes = variants
    .map((variant, index) => {
      const values = new Set(variant.attribute_values);
      const containsAll = [...arr].every((v) => values.has(v));
      return containsAll ? index : null;
    })
    .filter((index): index is number => index !== null);

  return variant_indexes;
};

export const generateVariantIndexById = (
  variants: ProductVariant[],
  id: number,
): number[] => {
  return [variants.findIndex((variant) => variant?.id === id)];
};
