import type { Attribute, AttributeValue, ProductVariant } from '@/types';

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
    for (const value of attr.values || []) {
      if (value.id == valueId) {
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

const SKU_ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const randomSkuSegment = (length: number): string => {
  let segment = '';
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * SKU_ALPHANUMERIC.length);
    segment += SKU_ALPHANUMERIC[randomIndex];
  }
  return segment;
};

export const generateSku = (): string => {
  return `SKU-${randomSkuSegment(3)}-${randomSkuSegment(4)}`;
};
