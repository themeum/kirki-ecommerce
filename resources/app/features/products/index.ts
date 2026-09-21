export { default as SelectProductsDialog } from './components/shared/select-products-dialog';
export { buildProductSelection } from './components/shared/select-products-dialog/build-selection';
export type {
  ProductSelection,
  ProductVariantSelection,
} from './components/shared/select-products-dialog/types';
export { default as VariantFieldScope } from './components/variant-sections/field-scope';
export { default as VariantInventorySection } from './components/variant-sections/inventory/inventory';
export { default as BaseUnitPopover } from './components/variant-sections/price/base-unit-popover';
export { default as VariantPriceSection } from './components/variant-sections/price/price';
export { default as VariantShippingSection } from './components/variant-sections/shipping/shipping';
export {
  useVariantField,
  useVariantValues,
} from './components/variant-sections/use-variant-field';
export { groupDetails, optionsList, requiredFields } from './lib/seo-settings/utils';
export type { Attribute, AttributeValue, ProductAttribute } from './schemas/catalog/attribute';
export type { InventoryVariant, ProductVariant } from './schemas/catalog/variant';
export { InventoryVariantSchema, VariantSchema } from './schemas/catalog/variant';
export {
  type AddVariationFormInput,
  type AddVariationFormPayload,
  AddVariationFormSchema,
} from './schemas/forms/add-variation-form';
export {
  type VariationValueFormInput,
  type VariationValueFormPayload,
  VariationValueFormSchema,
} from './schemas/forms/variation-value-form';
export {
  useAttributeQuery,
  useAttributesQuery,
  useBulkDeleteAttributeValuesMutation,
  useCreateAttributeMutation,
  useCreateAttributeValueMutation,
  useDeleteAttributeMutation,
  useDeleteAttributeValueMutation,
  useUpdateAttributeValueMutation,
} from './services/attribute';
export { attributeKeys, productKeys } from './services/query-keys';
export type { ProductListFilter, UnitPriceValue, UpdateVariantsPayload } from './types';
export { productListFilterConfig, productListOptions } from './types';
