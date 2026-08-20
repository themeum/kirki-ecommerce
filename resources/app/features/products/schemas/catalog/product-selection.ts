import { z } from 'zod';

import { MoneyObjectSchema } from '@/schemas/shared/api';

export const ProductVariantSelectionSchema = z.object({
  variantId: z.number(),
  variantLabel: z.string(),
  thumbnail: z.string().nullish(),
  inStock: z.boolean(),
  regularPrice: MoneyObjectSchema,
  salePrice: MoneyObjectSchema.nullish(),
});

export type ProductVariantSelection = z.infer<typeof ProductVariantSelectionSchema>;

export const ProductSelectionSchema = z.object({
  productId: z.number(),
  productTitle: z.string(),
  thumbnail: z.string().nullish(),
  inStock: z.boolean(),
  regularPrice: MoneyObjectSchema,
  salePrice: MoneyObjectSchema.nullish(),
  variants: z.array(ProductVariantSelectionSchema),
});

export type ProductSelection = z.infer<typeof ProductSelectionSchema>;
