import type { ProductAttribute } from '@/features/products/schemas/catalog/product';
import type { ProductVariant } from '@/features/products/schemas/catalog/variant';
export const getAttributeValueLabel = (
  attributes: ProductAttribute[],
  valueId: number,
): string => {
  for (const attribute of attributes) {
    const match = attribute.values?.find((value) => value.id === valueId);

    if (match) {
      return match.value;
    }
  }

  return String(valueId);
};

export const getVariantLabel = (
  attributes: ProductAttribute[],
  variant: ProductVariant,
): string =>
  variant.attribute_values
    .map((valueId) => getAttributeValueLabel(attributes, valueId))
    .join(' | ');
