import type { Attribute } from '@/types/entities/attribute';
import type { MediaRef } from '@/types/entities/media';

type ProductStatus = 'draft' | 'published' | 'unpublished' | 'archived';

type UnitPriceValue = {
  total_unit_amount?: number | string | null;
  total_unit?: string | null;
  base_unit_amount?: number | string | null;
  base_unit?: string | null;
};

type ProductCurrency = {
  id: number;
  code: string;
  name: string;
  symbol: string;
};

type ProductBrand = {
  id: number;
  name: string;
  logo: MediaRef | null;
};

type ProductCategoryRef = {
  id: number;
  name: string;
  parent_id?: number | null;
  level?: number;
};

type ProductTagRef = {
  id: number;
  name: string;
};

type ProductCollectionRef = {
  id: number;
  title: string;
};

type ProductVariant = {
  id?: number;
  name?: string;
  attribute_values: number[];
  media: MediaRef | null;
  sku: string | null;
  barcode: string | null;
  price: number | string | null;
  show_unit_price: boolean | null;
  base_unit: string | null | undefined;
  base_unit_amount: number | string | null | undefined;
  total_unit: string | null | undefined;
  total_unit_amount: number | string | null | undefined;
  sale_price: number | string | null;
  cost_of_goods: number | string | null;
  weight: number | string | null;
  weight_unit: string | null;
  dimension_unit: string | null;
  charge_taxes: boolean;
  allow_back_order: boolean;
  track_inventory: boolean;
  available_quantity: number;
  in_stock: boolean;
  committed_quantity: number;
  has_limit_per_order: boolean;
  max_per_order: number | null;
  is_visible: boolean;
  is_physical_product: boolean;
  is_default: boolean;
  shipping_profile_id: number | null;
  shipping_box_id: number | null;
  tax_profile_id: number | null;
  product?: {
    name?: string;
    image?: MediaRef | null;
  };
};

type InventoryVariant = ProductVariant & {
  id: number;
};

type AdditionalInfoItem = {
  title?: string;
  content?: string;
  description?: string;
};

type ProductListItem = {
  id: number;
  title: string;
  slug?: string;
  image?: string | null;
  sku?: string | null;
  inventory?: number | string;
  price?: number | string;
  status: ProductStatus | string;
  created_at?: string;
  updated_at?: string;
};

type Product = {
  id?: number;
  title: string;
  slug: string;
  status: ProductStatus | string;
  ribbon: string | null;
  currency: ProductCurrency | null;
  brand: ProductBrand | null;
  description: string | null;
  additional_info: AdditionalInfoItem[] | null;
  allow_back_order: boolean;
  has_limit_per_order?: boolean;
  max_per_order?: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  schema_id: number | null;
  llm_instructions: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: MediaRef | number | null;
  has_variants: boolean;
  categories: ProductCategoryRef[];
  tags: ProductTagRef[];
  collections: ProductCollectionRef[];
  attributes: Attribute[];
  variants: ProductVariant[];
  media: MediaRef[];
  created_at?: string;
  updated_at?: string;
};

type ProductAttributePayload = {
  id: number;
  values: number[];
};

type ProductVariantPayload = Omit<ProductVariant, 'media' | 'product'> & {
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
  additional_info?: AdditionalInfoItem[] | null;
  allow_back_order?: boolean | null;
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
  ProductStatus,
  UnitPriceValue,
  ProductCurrency,
  ProductBrand,
  ProductCategoryRef,
  ProductTagRef,
  ProductCollectionRef,
  ProductVariant,
  InventoryVariant,
  AdditionalInfoItem,
  ProductListItem,
  Product,
  ProductAttributePayload,
  ProductVariantPayload,
  ProductFormData,
  UpdateProductPayload,
  UpdateVariantsPayload,
};
