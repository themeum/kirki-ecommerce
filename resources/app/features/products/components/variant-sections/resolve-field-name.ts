import type { VariantFieldKey } from '@/features/products/schemas/forms/variant-fields';

/**
 * Where a variant's fields sit in the host form: at its root on the variant
 * edit page, under an array entry in the unified product form.
 */
type VariantFieldPrefix = '' | `variants.${number}.`;

const resolveVariantFieldName = (prefix: VariantFieldPrefix, key: VariantFieldKey): string => {
  return `${prefix}${key}`;
};

export { resolveVariantFieldName, type VariantFieldPrefix };
