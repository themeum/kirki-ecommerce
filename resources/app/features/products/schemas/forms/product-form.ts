import { z } from 'zod';

import { ProductAttributeSchema } from '@/features/products/schemas/catalog/attribute';
import type { Product } from '@/features/products/schemas/catalog/product';
import {
  AdditionalInfoItemSchema,
  ProductBrandSchema,
  ProductCategoryRefSchema,
  ProductCollectionRefSchema,
  ProductCurrencySchema,
  ProductStatusSchema,
  ProductTagRefSchema,
} from '@/features/products/schemas/catalog/product';
import type { ProductVariant } from '@/features/products/schemas/catalog/variant';
import { ProductBasicsFormSchema } from '@/features/products/schemas/forms/product-basics-form';
import { ProductSeoFormSchema } from '@/features/products/schemas/forms/product-seo-form';
import { booleanish, mediaId, numberOrNull, pickFormValues, prepareFormSchema } from '@/libs/zod';
import { moneyAmount } from '@/schemas/forms/shared/validators';
import { MediaRefSchema } from '@/schemas/shared/media';

const ProductFormVariantShape = z.object({
  id: z.number().optional(),
  name: z.string().nullish().default(''),
  media: mediaId(),
  sku: z.string().nullish(),
  barcode: z.string().nullish(),
  base_price: moneyAmount.nullish(),
  show_unit_price: z.boolean().nullish().default(false),
  base_unit: z.string().nullish(),
  base_unit_amount: moneyAmount.nullish(),
  total_unit: z.string().nullish(),
  total_unit_amount: moneyAmount.nullish(),
  base_sale_price: moneyAmount.nullish(),
  base_cost_of_goods: moneyAmount.nullish(),
  weight: moneyAmount.nullish(),
  weight_unit: z.string().nullish(),
  dimension_unit: z.string().nullish(),
  charge_taxes: z.boolean().nullish(),
  allow_back_order: z.boolean().nullish(),
  track_inventory: z.boolean().nullish(),
  available_quantity: numberOrNull(),
  in_stock: booleanish(false),
  committed_quantity: numberOrNull(),
  min_stock_threshold: numberOrNull(),
  has_limit_per_order: z.boolean().nullish(),
  max_per_order: numberOrNull(),
  tax_profile_id: numberOrNull(),
  shipping_profile_id: numberOrNull(),
  shipping_box_id: numberOrNull(),
  is_visible: z.boolean().nullish(),
  is_physical_product: z.boolean().nullish(),
  is_default: z.boolean().nullish(),
  attribute_values: z.array(z.number()).default([]),
});

export const ProductFormVariantSchema = prepareFormSchema(ProductFormVariantShape).transform((values) => ({
  id: values.id,
  name: values.name || '',
  media: values.media,
  sku: values.sku || null,
  barcode: values.barcode || null,
  base_price: values.base_price ?? null,
  show_unit_price: values.show_unit_price ?? false,
  base_unit: values.base_unit || null,
  base_unit_amount: values.base_unit_amount ?? null,
  total_unit: values.total_unit || null,
  total_unit_amount: values.total_unit_amount ?? null,
  base_sale_price: values.base_sale_price ?? null,
  base_cost_of_goods: values.base_cost_of_goods ?? null,
  weight: values.weight ?? null,
  weight_unit: values.weight_unit || null,
  dimension_unit: values.dimension_unit || null,
  charge_taxes: values.charge_taxes ?? true,
  allow_back_order: values.allow_back_order ?? false,
  track_inventory: values.track_inventory ?? false,
  available_quantity: values.available_quantity ?? 0,
  in_stock: values.in_stock,
  committed_quantity: values.committed_quantity ?? 0,
  min_stock_threshold: values.min_stock_threshold,
  has_limit_per_order: values.has_limit_per_order ?? false,
  max_per_order: values.max_per_order,
  tax_profile_id: values.tax_profile_id,
  shipping_profile_id: values.shipping_profile_id,
  shipping_box_id: values.shipping_box_id,
  is_visible: values.is_visible ?? true,
  is_physical_product: values.is_physical_product ?? true,
  is_default: values.is_default ?? false,
  attribute_values: values.attribute_values,
}));

export type ProductFormVariantInput = z.input<typeof ProductFormVariantSchema>;

export type ProductFormVariantPayload = z.output<typeof ProductFormVariantSchema>;

const ProductFormComposedShape = ProductBasicsFormSchema.extend({
  status: z.union([ProductStatusSchema, z.string()]).default('draft'),
  brand: ProductBrandSchema.nullish().default(null),
  currency: ProductCurrencySchema.nullish().default(null),
  categories: z.array(ProductCategoryRefSchema).default([]),
  tags: z.array(ProductTagRefSchema).default([]),
  collections: z.array(ProductCollectionRefSchema).default([]),
  media: z.array(MediaRefSchema).default([]),
  additional_info: z.array(AdditionalInfoItemSchema).default([]),
  seo_keywords: z.array(z.string()).nullish().default([]),
  has_variants: z.boolean().default(false),
  attributes: z.array(ProductAttributeSchema).default([]),
  variants: z.array(ProductFormVariantSchema).min(1),
  id: z.number().optional(),
}).merge(ProductSeoFormSchema);

export const ProductFormSchema = prepareFormSchema(ProductFormComposedShape).transform((values) => ({
  id: values.id,
  title: values.title,
  slug: values.slug || null,
  status: values.status,
  ribbon: values.ribbon || null,
  description: values.description || null,
  short_description: values.short_description || null,
  additional_info: values.additional_info,
  seo_title: values.seo_title || null,
  seo_description: values.seo_description || null,
  seo_keywords: values.seo_keywords ?? [],
  og_title: values.og_title || null,
  og_description: values.og_description || null,
  og_image: null,
  schema_id: values.schema_id,
  llm_instructions: values.llm_instructions || null,
  has_variants: values.has_variants,
  attributes: values.attributes.map((item) => ({
    id: item.id,
    values: (item.values ?? []).map((value) => value.id),
  })),
  media: values.media.map((item) => Number(item.id)),
  brand_id: values.brand?.id ?? null,
  categories: values.categories.map((item) => item.id),
  tags: values.tags.map((item) => item.id),
  collections: values.collections.map((item) => item.id),
  variants: values.variants,
  currency_id: values.currency?.id ?? null,
}));

export type ProductFormInput = z.input<typeof ProductFormSchema>;

export type ProductFormPayload = z.output<typeof ProductFormSchema>;

export const getDefaultVariantValues = (): ProductFormVariantInput => ({
  attribute_values: [],
  media: null,
  sku: null,
  barcode: null,
  base_price: null,
  show_unit_price: false,
  base_unit: null,
  base_unit_amount: null,
  total_unit: null,
  total_unit_amount: null,
  base_sale_price: null,
  base_cost_of_goods: null,
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
  has_limit_per_order: false,
  max_per_order: null,
  is_visible: true,
  is_physical_product: true,
  is_default: true,
  shipping_profile_id: null,
  shipping_box_id: null,
  tax_profile_id: null,
});

/**
 * A product must carry exactly one default variant. Products written before
 * that was enforced can hold none or several, so both the hydration path and
 * the variant matrix funnel through here: keep a sole surviving default,
 * otherwise fall back to the first variant.
 */
export const normalizeDefaultVariant = (
  variants: ProductFormVariantInput[],
): ProductFormVariantInput[] => {
  if (variants.length === 0) {
    return variants;
  }

  const defaultIndexes = variants.reduce<number[]>((indexes, variant, index) => {
    if (variant.is_default) {
      indexes.push(index);
    }
    return indexes;
  }, []);

  const defaultIndex = defaultIndexes.length === 1 ? defaultIndexes[0] : 0;

  return variants.map((variant, index) => {
    const isDefault = index === defaultIndex;
    if (variant.is_default === isDefault) {
      return variant;
    }
    return { ...variant, is_default: isDefault };
  });
};

/**
 * Hydration fallbacks that differ from the schema's own creation defaults —
 * an existing variant with no `max_per_order` set should read as 1, not the
 * `null` a brand new variant starts with — so these three can't be expressed
 * generically and are overridden explicitly.
 */
const mapVariantToFormValues = (variant: ProductVariant): ProductFormVariantInput =>
  pickFormValues(ProductFormVariantSchema, variant, {
    max_per_order: variant.max_per_order ?? 1,
    available_quantity: variant.available_quantity ?? 0,
    committed_quantity: variant.committed_quantity ?? 0,
  });

export const mapProductToFormValues = (product: Product): ProductFormInput => {
  const variants: ProductFormVariantInput[] =
    !product.variants || product.variants.length === 0
      ? [getDefaultVariantValues()]
      : normalizeDefaultVariant(product.variants.map(mapVariantToFormValues));

  return pickFormValues(ProductFormSchema, product, {
    variants,
    additional_info: product.additional_info ?? [],
    seo_keywords: product.seo_keywords ?? [],
  });
};
