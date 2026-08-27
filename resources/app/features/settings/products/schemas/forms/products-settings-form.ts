import { z } from 'zod';

import { numberOrNull, prepareFormSchema } from '@/libs/zod';

const ProductsSettingsFormShape = z.object({
  weight_unit: z.string().nullish().default('kg'),
  dimension_unit: z.string().nullish().default('m'),
  shop_page: numberOrNull(),
  is_unit_price_visible: z.boolean().default(false),
  is_enabled_reviews: z.boolean().default(false),
  is_enabled_star_ratings: z.boolean().default(false),
  low_stock_threshold: numberOrNull(),
  barcode_generation: z.record(z.any()).nullish(),
});

export const ProductsSettingsFormSchema = prepareFormSchema(ProductsSettingsFormShape).transform((values) => ({
  weight_unit: values.weight_unit || null,
  dimension_unit: values.dimension_unit || null,
  shop_page: values.shop_page,
  is_unit_price_visible: values.is_unit_price_visible,
  is_enabled_reviews: values.is_enabled_reviews,
  is_enabled_star_ratings: values.is_enabled_star_ratings,
  low_stock_threshold: values.low_stock_threshold,
  barcode_generation: values.barcode_generation ?? null,
}));

export type ProductsSettingsFormInput = z.input<typeof ProductsSettingsFormSchema>;

export type ProductsSettingsFormPayload = z.output<typeof ProductsSettingsFormSchema>;
