import { z } from 'zod';

import { booleanish, mediaId, moneyOrNull, numberOrNull, requiredWhen } from '@/libs/zod';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

/**
 * The variant fields both the product form and the variant edit form bind.
 * Kept as a plain `ZodObject` so each form can extend it and apply its own
 * terminal `prepareFormSchema(...).transform(...)`.
 */
const VariantFieldsShape = z.object({
  id: z.number().optional(),
  media: mediaId(),
  sku: z.string().nullish(),
  base_price: moneyOrNull(),
  base_unit: z.string().nullish(),
  base_unit_amount: numberOrNull(),
  total_unit: z.string().nullish(),
  total_unit_amount: numberOrNull(),
  base_sale_price: requiredWhen(
    moneyOrNull(),
    (values) =>
      isDefined(values.base_sale_price) &&
      isDefined(values.base_price) &&
      Number(values.base_sale_price) > Number(values.base_price),
    __('The sale price cannot be greater than the regular price.', 'kirki-ecommerce'),
  ),
  base_cost_of_goods: moneyOrNull(),
  weight: numberOrNull(),
  weight_unit: z.string().nullish(),
  charge_taxes: z.boolean().nullish(),
  allow_back_order: z.boolean().nullish(),
  track_inventory: z.boolean().nullish(),
  available_quantity: numberOrNull(),
  committed_quantity: numberOrNull(),
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

type VariantFieldsInput = z.input<typeof VariantFieldsShape>;

type VariantFieldKey = keyof VariantFieldsInput;

export { VariantFieldsShape, type VariantFieldKey, type VariantFieldsInput };
