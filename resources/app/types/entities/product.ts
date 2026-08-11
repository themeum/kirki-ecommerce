export type {
  AdditionalInfoItem, Product,
  ProductAttribute, ProductBrand,
  ProductCategoryRef, ProductCollectionRef, ProductCurrency, ProductListItem, ProductStatus, ProductTagRef
} from '@/schemas/catalog/product';

export type { InventoryVariant, ProductVariant } from '@/schemas/catalog/variant';

type UnitPriceValue = {
  total_unit_amount?: number | string | null;
  total_unit?: string | null;
  base_unit_amount?: number | string | null;
  base_unit?: string | null;
};

type UpdateVariantsPayload = {
  key: string;
  value: unknown;
  variant_index?: number[];
};

export type { UnitPriceValue, UpdateVariantsPayload };
