import { z } from 'zod';

export const ProductsSettingsFormSchema = z
  .object({
    weight_unit: z.string().optional(),
    dimension_unit: z.string().optional(),
    shop_page: z.union([z.string(), z.number()]).optional().nullable(),
    is_unit_price_visible: z.boolean().optional(),
    is_enabled_reviews: z.boolean().optional(),
    is_enabled_star_ratings: z.boolean().optional(),
    barcode_generation: z.record(z.any()).optional(),
  })
  .passthrough();

export type ProductsSettingsFormValues = z.infer<
  typeof ProductsSettingsFormSchema
>;

export const productsSettingsDefaultValues: ProductsSettingsFormValues = {
  weight_unit: 'kg',
  dimension_unit: 'm',
  shop_page: null,
  is_unit_price_visible: false,
  is_enabled_reviews: false,
  is_enabled_star_ratings: false,
};
