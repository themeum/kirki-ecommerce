import { z } from 'zod';

import { ProductAttributeSchema } from '@/schemas/catalog/attribute';
import { VariantSchema } from '@/schemas/catalog/variant';
import { MoneyAmountSchema, MoneyObjectSchema } from '@/schemas/shared/api';
import { MediaRefSchema } from '@/schemas/shared/media';

export const ProductStatusSchema = z.enum([
  'draft',
  'published',
  'unpublished',
  'archived',
]);

export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductCurrencySchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
});

export type ProductCurrency = z.infer<typeof ProductCurrencySchema>;

export const ProductBrandSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: MediaRefSchema.nullable(),
});

export type ProductBrand = z.infer<typeof ProductBrandSchema>;

export const ProductCategoryRefSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent_id: z.number().nullish(),
  level: z.number().optional(),
});

export type ProductCategoryRef = z.infer<typeof ProductCategoryRefSchema>;

export const ProductTagRefSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type ProductTagRef = z.infer<typeof ProductTagRefSchema>;

export const ProductCollectionRefSchema = z.object({
  id: z.number(),
  title: z.string(),
});

export type ProductCollectionRef = z.infer<typeof ProductCollectionRefSchema>;

export const AdditionalInfoItemSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  description: z.string().optional(),
});

export type AdditionalInfoItem = z.infer<typeof AdditionalInfoItemSchema>;

export const ProductListItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string().optional(),
  image: z.string().nullish(),
  sku: z.string().nullish(),
  inventory: z.number().optional(),
  base_price: MoneyAmountSchema,
  base_price_money_object: MoneyObjectSchema,
  display_price: MoneyAmountSchema,
  display_price_money_object: MoneyObjectSchema,
  base_sale_price: MoneyAmountSchema.nullable(),
  base_sale_price_money_object: MoneyObjectSchema.nullable(),
  display_sale_price: MoneyAmountSchema.nullish(),
  display_sale_price_money_object: MoneyObjectSchema.nullish(),
  status: z.union([ProductStatusSchema, z.string()]),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type ProductListItem = z.infer<typeof ProductListItemSchema>;

export const ProductListItemWithVariantsSchema = ProductListItemSchema.extend({
  has_variants: z.boolean(),
  attributes: z.array(ProductAttributeSchema),
  variants: z.array(VariantSchema),
})

export type ProductListItemWithVariants = z.infer<typeof ProductListItemWithVariantsSchema>;

export const ProductSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  slug: z.string(),
  status: z.union([ProductStatusSchema, z.string()]),
  ribbon: z.string().nullable(),
  currency: ProductCurrencySchema.nullable(),
  brand: ProductBrandSchema.nullable(),
  description: z.string().nullable(),
  short_description: z.string().nullable().optional(),
  additional_info: z.array(AdditionalInfoItemSchema).nullable(),
  has_limit_per_order: z.boolean().optional(),
  max_per_order: z.number().nullish(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  seo_keywords: z.array(z.string()).nullable(),
  og_title: z.string().nullable(),
  og_description: z.string().nullable(),
  og_image: MediaRefSchema.nullable(),
  schema_id: z.number().nullable(),
  llm_instructions: z.string().nullable(),
  has_variants: z.boolean(),
  categories: z.array(ProductCategoryRefSchema),
  tags: z.array(ProductTagRefSchema),
  collections: z.array(ProductCollectionRefSchema),
  attributes: z.array(ProductAttributeSchema),
  variants: z.array(VariantSchema),
  media: z.array(MediaRefSchema),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type Product = z.infer<typeof ProductSchema>;

export type { ProductAttribute } from '@/schemas/catalog/attribute';
export type { InventoryVariant, ProductVariant } from '@/schemas/catalog/variant';

