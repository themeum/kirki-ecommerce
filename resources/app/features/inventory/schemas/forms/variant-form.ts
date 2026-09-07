import { z } from 'zod';

import { booleanish, mediaId, numberOrNull, prepareFormSchema, requiredWhen } from '@/libs/zod';
import { MoneyAmountSchema } from '@/schemas/shared/api';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const VariantFormShape = z.object({
  id: z.number().optional(),
  media: mediaId(),
  sku: z.string().nullish(),
  base_price: MoneyAmountSchema.nullish(),
  show_unit_price: z.boolean().nullish().default(false),
  base_unit: z.string().nullish(),
  base_unit_amount: MoneyAmountSchema.nullish(),
  total_unit: z.string().nullish(),
  total_unit_amount: MoneyAmountSchema.nullish(),
  base_sale_price: requiredWhen(
    MoneyAmountSchema.nullish(),
    (values) =>
      isDefined(values.base_sale_price) &&
      isDefined(values.base_price) &&
      Number(values.base_sale_price) > Number(values.base_price),
    __('The sale price cannot be greater than the regular price.', 'kirki-ecommerce'),
  ),
  base_cost_of_goods: MoneyAmountSchema.nullish(),
  weight: MoneyAmountSchema.nullish(),
  weight_unit: z.string().nullish(),
  charge_taxes: z.boolean().nullish(),
  allow_back_order: z.boolean().nullish(),
  track_inventory: z.boolean().nullish(),
  available_quantity: numberOrNull(),
  in_stock: booleanish(false),
  low_stock_threshold: numberOrNull(),
  has_limit_per_order: z.boolean().nullish(),
  max_per_order: numberOrNull(),
  tax_profile_id: numberOrNull(),
  shipping_profile_id: numberOrNull(),
  shipping_box_id: numberOrNull(),
  is_visible: z.boolean().nullish(),
  is_physical_product: z.boolean().nullish(),
});

const VariantFormSchema = prepareFormSchema(VariantFormShape).transform((values) => ({
  id: values.id,
  media: values.media,
  sku: values.sku || null,
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
  charge_taxes: values.charge_taxes ?? true,
  allow_back_order: values.allow_back_order ?? false,
  track_inventory: values.track_inventory ?? false,
  available_quantity: values.available_quantity ?? 0,
  in_stock: values.in_stock,
  low_stock_threshold: values.low_stock_threshold,
  has_limit_per_order: values.has_limit_per_order ?? false,
  max_per_order: values.max_per_order,
  tax_profile_id: values.tax_profile_id,
  shipping_profile_id: values.shipping_profile_id,
  shipping_box_id: values.shipping_box_id,
  is_visible: values.is_visible ?? true,
  is_physical_product: values.is_physical_product ?? true,
}));

type VariantFormInput = z.input<typeof VariantFormSchema>;
type VariantFormPayload = z.output<typeof VariantFormSchema>;

export { type VariantFormInput, type VariantFormPayload, VariantFormSchema };
