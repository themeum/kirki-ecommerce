import { z } from 'zod';

import { MoneyAmountSchema } from '@/schemas/shared/api';
import { MediaRefSchema } from '@/schemas/shared/media';

export const VariantSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  media: MediaRefSchema.nullish(),
  sku: z.string().nullable(),
  barcode: z.string().nullable(),
  price: MoneyAmountSchema.nullable(),
  show_unit_price: z.boolean().nullish(),
  base_unit: z.string().nullish(),
  base_unit_amount: MoneyAmountSchema.nullish(),
  total_unit: z.string().nullish(),
  total_unit_amount: MoneyAmountSchema.nullish(),
  sale_price: MoneyAmountSchema.nullable(),
  cost_of_goods: MoneyAmountSchema.nullable(),
  weight: MoneyAmountSchema.nullable(),
  weight_unit: z.string().nullable(),
  dimension_unit: z.string().nullish(),
  charge_taxes: z.boolean(),
  allow_back_order: z.boolean(),
  track_inventory: z.boolean(),
  available_quantity: z.number(),
  in_stock: z.boolean(),
  committed_quantity: z.number(),
  has_limit_per_order: z.boolean(),
  max_per_order: z.number().nullable(),
  tax_profile_id: z.number().nullable(),
  shipping_profile_id: z.number().nullable(),
  shipping_box_id: z.number().nullable(),
  is_visible: z.boolean(),
  is_physical_product: z.boolean(),
  is_default: z.boolean(),
  attribute_values: z.array(z.number()),
  created_by: z.number().nullish(),
  updated_by: z.number().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type ProductVariant = z.infer<typeof VariantSchema>;

export const InventoryVariantSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string().nullable(),
  price: MoneyAmountSchema.nullable(),
  sale_price: MoneyAmountSchema.nullable(),
  cost_of_goods: MoneyAmountSchema.nullable(),
  stock_quantity: z.number().nullish(),
  product: z.object({
    id: z.number(),
    name: z.string(),
    image: MediaRefSchema.nullish(),
  }),
});

export type InventoryVariant = z.infer<typeof InventoryVariantSchema>;
