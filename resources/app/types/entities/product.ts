import type { AdditionalInfoItem, ProductStatus } from '@/schemas/catalog/product';
import type { ProductVariant } from '@/schemas/catalog/variant';

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

type ProductAttributePayload = {
  id: number;
  values: number[];
};

type ProductVariantPayload = Omit<ProductVariant, 'media'> & {
  media?: number | null;
};

type ProductFormData = {
  title?: string;
  slug?: string | null;
  status?: ProductStatus | string | null;
  ribbon?: string | null;
  currency_id?: number | null;
  brand_id?: number | null;
  description?: string | null;
  short_description?: string | null;
  additional_info?: AdditionalInfoItem[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: number | null;
  schema_id?: number | null;
  llm_instructions?: string | null;
  has_variants?: boolean | null;
  media?: number[];
  categories?: number[];
  tags?: number[];
  collections?: number[];
  attributes?: ProductAttributePayload[];
  variants?: ProductVariantPayload[];
};

type UpdateProductPayload = {
  key: string;
  value: unknown;
  variants?: boolean;
};

type UpdateVariantsPayload = {
  key: string;
  value: unknown;
  variant_index?: number[];
};

export type {
  ProductAttributePayload, ProductFormData, ProductVariantPayload, UnitPriceValue, UpdateProductPayload,
  UpdateVariantsPayload
};

