import { z } from 'zod';

import { ProductAttributeSchema } from '@/schemas/catalog/attribute';
import {
  AdditionalInfoItemSchema,
  ProductBrandSchema,
  ProductCategoryRefSchema,
  ProductCollectionRefSchema,
  ProductCurrencySchema,
  ProductStatusSchema,
  ProductTagRefSchema,
} from '@/schemas/catalog/product';
import type { ProductVariant } from '@/schemas/catalog/variant';
import { ProductBasicsFormSchema } from '@/schemas/forms/product-basics-form';
import { ProductSeoFormSchema } from '@/schemas/forms/product-seo-form';
import {
  moneyAmount,
  optionalNullableString,
} from '@/schemas/forms/shared/validators';
import { MediaRefSchema } from '@/schemas/shared/media';
import type { Product, ProductFormData } from '@/types';

export const ProductFormVariantSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  media: MediaRefSchema.nullish(),
  sku: optionalNullableString(),
  barcode: optionalNullableString(),
  price: moneyAmount.nullable().optional(),
  show_unit_price: z.boolean().nullish(),
  base_unit: z.string().nullish(),
  base_unit_amount: moneyAmount.nullish(),
  total_unit: z.string().nullish(),
  total_unit_amount: moneyAmount.nullish(),
  sale_price: moneyAmount.nullable().optional(),
  cost_of_goods: moneyAmount.nullable().optional(),
  weight: moneyAmount.nullable().optional(),
  weight_unit: z.string().nullable().optional(),
  dimension_unit: z.string().nullish(),
  charge_taxes: z.boolean().optional(),
  allow_back_order: z.boolean().optional(),
  track_inventory: z.boolean().optional(),
  available_quantity: z.union([z.number(), z.string()]).optional().nullable(),
  in_stock: z.union([z.boolean(), z.string()]).optional(),
  committed_quantity: z.union([z.number(), z.string()]).optional().nullable(),
  min_stock_threshold: z.union([z.number(), z.string()]).optional().nullable(),
  has_limit_per_order: z.boolean().optional(),
  max_per_order: z.number().nullable(),
  tax_profile_id: z.union([z.number(), z.string(), z.null()]).optional(),
  shipping_profile_id: z.union([z.number(), z.string(), z.null()]).optional(),
  shipping_box_id: z.union([z.number(), z.string(), z.null()]).optional(),
  is_visible: z.boolean().optional(),
  is_physical_product: z.boolean().optional(),
  is_default: z.boolean().optional(),
  attribute_values: z.array(z.number()).optional(),
});

export type ProductFormVariantValues = z.infer<typeof ProductFormVariantSchema>;

export const ProductFormSchema = ProductBasicsFormSchema.extend({
  status: z.union([ProductStatusSchema, z.string()]),
  brand: ProductBrandSchema.nullable(),
  currency: ProductCurrencySchema.nullable(),
  categories: z.array(ProductCategoryRefSchema),
  tags: z.array(ProductTagRefSchema),
  collections: z.array(ProductCollectionRefSchema),
  media: z.array(MediaRefSchema),
  additional_info: z.array(AdditionalInfoItemSchema),
  seo_keywords: z.array(z.string()).nullable().optional(),
  has_variants: z.boolean(),
  attributes: z.array(ProductAttributeSchema),
  variants: z.array(ProductFormVariantSchema).min(1),
  id: z.number().optional(),
}).merge(ProductSeoFormSchema);

export type ProductFormValues = z.infer<typeof ProductFormSchema>;

export const getDefaultVariantValues = (): ProductFormVariantValues => ({
  attribute_values: [],
  media: null,
  sku: null,
  barcode: null,
  price: null,
  show_unit_price: false,
  base_unit: null,
  base_unit_amount: null,
  total_unit: null,
  total_unit_amount: null,
  sale_price: null,
  cost_of_goods: null,
  weight: null,
  weight_unit: null,
  dimension_unit: null,
  charge_taxes: true,
  allow_back_order: false,
  track_inventory: false,
  available_quantity: null,
  in_stock: true,
  committed_quantity: null,
  min_stock_threshold: null,
  has_limit_per_order: true,
  max_per_order: null,
  is_visible: true,
  is_physical_product: true,
  is_default: true,
  shipping_profile_id: null,
  shipping_box_id: null,
  tax_profile_id: null,
});

export const getProductFormDefaultValues = (): ProductFormValues => ({
  title: '',
  slug: '',
  status: 'draft',
  ribbon: '',
  currency: null,
  brand: null,
  description: '',
  short_description: '',
  additional_info: [],
  seo_title: '',
  seo_description: '',
  seo_keywords: [],
  schema_id: null,
  llm_instructions: '',
  og_title: null,
  og_description: null,
  og_image: null,
  has_variants: false,
  categories: [],
  tags: [],
  collections: [],
  attributes: [],
  variants: [getDefaultVariantValues()],
  media: [],
});

const mapVariantToFormValues = (
  variant: ProductVariant,
): ProductFormVariantValues => ({
  id: variant.id,
  name: variant.name,
  media: variant.media ?? null,
  sku: variant.sku ?? null,
  barcode: variant.barcode ?? null,
  price: variant.price ?? null,
  show_unit_price: variant.show_unit_price ?? false,
  base_unit: variant.base_unit ?? null,
  base_unit_amount: variant.base_unit_amount ?? null,
  total_unit: variant.total_unit ?? null,
  total_unit_amount: variant.total_unit_amount ?? null,
  sale_price: variant.sale_price ?? null,
  cost_of_goods: variant.cost_of_goods ?? null,
  weight: variant.weight ?? null,
  weight_unit: variant.weight_unit ?? null,
  dimension_unit: variant.dimension_unit ?? null,
  charge_taxes: variant.charge_taxes ?? true,
  track_inventory: variant.track_inventory ?? false,
  available_quantity: variant.available_quantity ?? 0,
  in_stock: variant.in_stock ?? true,
  committed_quantity: variant.committed_quantity ?? 0,
  min_stock_threshold: variant.min_stock_threshold ?? null,
  has_limit_per_order: variant.has_limit_per_order ?? true,
  max_per_order: variant.max_per_order ?? 1,
  tax_profile_id: variant.tax_profile_id ?? null,
  shipping_profile_id: variant.shipping_profile_id ?? null,
  shipping_box_id: variant.shipping_box_id ?? null,
  is_visible: variant.is_visible ?? true,
  is_physical_product: variant.is_physical_product ?? true,
  is_default: variant.is_default ?? false,
  attribute_values: variant.attribute_values ?? [],
});

export const mapProductToFormValues = (
  product: Product,
): ProductFormValues => {
  const variants =
    !product.variants || product.variants.length === 0
      ? [getDefaultVariantValues()]
      : product.variants.map(mapVariantToFormValues);

  return {
    id: product.id,
    title: product.title ?? '',
    slug: product.slug ?? '',
    status: product.status ?? 'draft',
    ribbon: product.ribbon ?? '',
    currency: product.currency ?? null,
    brand: product.brand ?? null,
    description: product.description ?? '',
    short_description: product.short_description ?? '',
    additional_info: product.additional_info ?? [],
    seo_title: product.seo_title ?? '',
    seo_description: product.seo_description ?? '',
    seo_keywords: product.seo_keywords ?? [],
    schema_id: product.schema_id ?? null,
    llm_instructions: product.llm_instructions ?? '',
    og_title: product.og_title ?? null,
    og_description: product.og_description ?? null,
    og_image: product.og_image ?? null,
    has_variants: product.has_variants ?? false,
    categories: product.categories ?? [],
    tags: product.tags ?? [],
    collections: product.collections ?? [],
    attributes: product.attributes ?? [],
    variants,
    media: product.media ?? [],
  };
};

const toNumberOrNull = (
  value: number | string | null | undefined,
): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toBoolean = (value: boolean | string | null | undefined): boolean => {
  if (typeof value === 'string') {
    return value.toLowerCase() !== 'false';
  }
  return Boolean(value);
};

export const buildProductPayload = (
  values: ProductFormValues,
): ProductFormData => {
  const attributes = (values.attributes ?? []).map((item) => ({
    id: item.id,
    values: (item.values ?? []).map((val) => Number(val.id)),
  }));

  const variants = (values.variants ?? []).map((item) => ({
    ...item,
    name: item.name ?? '',
    media: Number(item.media?.id) || null,
    sku: item.sku ?? null,
    barcode: item.barcode ?? null,
    price: item.price ?? null,
    sale_price: item.sale_price ?? null,
    cost_of_goods: item.cost_of_goods ?? null,
    weight: item.weight ?? null,
    weight_unit: item.weight_unit ?? null,
    show_unit_price: item.show_unit_price ?? false,
    charge_taxes: item.charge_taxes ?? true,
    allow_back_order: item.allow_back_order ?? false,
    track_inventory: item.track_inventory ?? false,
    available_quantity: toNumberOrNull(item.available_quantity) ?? 0,
    committed_quantity: toNumberOrNull(item.committed_quantity) ?? 0,
    min_stock_threshold: toNumberOrNull(item.min_stock_threshold),
    in_stock: toBoolean(item.in_stock),
    has_limit_per_order: item.has_limit_per_order ?? true,
    max_per_order: toNumberOrNull(item.max_per_order),
    tax_profile_id: toNumberOrNull(item.tax_profile_id as number | string | null),
    shipping_profile_id: toNumberOrNull(
      item.shipping_profile_id as number | string | null,
    ),
    shipping_box_id: toNumberOrNull(
      item.shipping_box_id as number | string | null,
    ),
    is_visible: item.is_visible ?? true,
    is_physical_product: item.is_physical_product ?? true,
    is_default: item.is_default ?? false,
    attribute_values: item.attribute_values ?? [],
  }));

  return {
    title: values.title,
    slug: values.slug,
    status: values.status,
    ribbon: values.ribbon,
    description: values.description,
    short_description: values.short_description,
    additional_info: values.additional_info,
    seo_title: values.seo_title,
    seo_description: values.seo_description,
    seo_keywords: values.seo_keywords,
    og_title: values.og_title,
    og_description: values.og_description,
    og_image: null,
    schema_id: toNumberOrNull(values.schema_id as number | string | null),
    llm_instructions: values.llm_instructions,
    has_variants: values.has_variants,
    attributes,
    media: (values.media ?? []).map((item) => Number(item.id)),
    brand_id: values.brand?.id ?? null,
    categories: (values.categories ?? []).map((item) => item.id),
    tags: (values.tags ?? []).map((item) => item.id),
    collections: (values.collections ?? []).map((item) => item.id),
    variants,
    currency_id: values.currency?.id ?? null,
  };
};
