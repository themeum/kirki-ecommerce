import type { Attribute } from './attribute';
import type { MediaRef } from './media';

type UnitPriceValue = {
  total_unit_amount?: number | string | null;
  total_unit?: string | null;
  base_unit_amount?: number | string | null;
  base_unit?: string | null;
};

type ProductVariant = {
  id?: number;
  name?: string;
  attribute_values: number[];
  media: MediaRef[] | MediaRef | null;
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
  [key: string]: unknown;
};

type ProductListItem = {
  id: number;
  title: string;
  image?: string;
  sku?: string;
  inventory?: number | string;
  price?: number | string;
  status: string;
  created_at?: string;
};

type Product = {
  id?: number;
  title: string;
  slug: string;
  status: string;
  ribbon: string;
  currency: Record<string, unknown>;
  brand: number | Record<string, unknown> | null;
  description: string;
  additional_info: AdditionalInfoItem[];
  allow_back_order: boolean;
  has_limit_per_order: boolean;
  max_per_order: number;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  schema_id: number | null;
  llm_instructions: string;
  og_title: string | null;
  og_description: string | null;
  og_image: MediaRef | number | null;
  has_variants: boolean;
  categories: number[];
  tags: number[];
  collections: number[];
  attributes: Attribute[];
  variants: ProductVariant[];
  media: MediaRef[];
};

type ProductFormData = Record<string, unknown>;

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
  UnitPriceValue,
  ProductVariant,
  InventoryVariant,
  AdditionalInfoItem,
  ProductListItem,
  Product,
  ProductFormData,
  UpdateProductPayload,
  UpdateVariantsPayload,
};
