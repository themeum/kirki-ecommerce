export { default as BaseUnitDialog } from './components/product-form/sections/price/base-unit-dialog';
export { default as SelectProductsDialog } from './components/shared/select-products-dialog';
export { buildProductSelection } from './components/shared/select-products-dialog/build-selection';
export type { ProductSelection, ProductVariantSelection } from './components/shared/select-products-dialog/types';
export { groupDetails, optionsList, requiredFields } from './lib/seo-settings/utils';
export type { Attribute, AttributeValue, ProductAttribute } from './schemas/catalog/attribute';
export { InventoryVariantSchema, VariantSchema } from './schemas/catalog/variant';
export type { InventoryVariant, ProductVariant } from './schemas/catalog/variant';
export {
  AddVariationFormSchema, type AddVariationFormInput,
  type AddVariationFormPayload
} from './schemas/forms/add-variation-form';
export {
  VariationValueFormSchema, type VariationValueFormInput,
  type VariationValueFormPayload
} from './schemas/forms/variation-value-form';
export {
  useAttributeQuery,
  useAttributesQuery,
  useBulkDeleteAttributeValuesMutation,
  useCreateAttributeMutation,
  useCreateAttributeValueMutation,
  useDeleteAttributeMutation,
  useDeleteAttributeValueMutation,
  useUpdateAttributeValueMutation
} from './services/attribute';
export { attributeKeys, productKeys } from './services/query-keys';
export { productListFilterConfig, productListOptions } from './types';
export type { ProductListFilter, UnitPriceValue, UpdateVariantsPayload } from './types';

