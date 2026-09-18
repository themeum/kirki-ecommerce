import { z } from 'zod';

import { moneyOrNull, numberOrNull, prepareFormSchema, requiredWhen } from '@/libs/zod';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const BulkEditVariantShape = z.object({
  id: z.number(),
  base_price: moneyOrNull(),
  base_sale_price: requiredWhen(
    moneyOrNull(),
    (values) =>
      isDefined(values.base_sale_price) &&
      isDefined(values.base_price) &&
      Number(values.base_sale_price) > Number(values.base_price),
    __('The sale price cannot be greater than the regular price.', 'kirki-ecommerce'),
  ),
  base_cost_of_goods: moneyOrNull(),
  sku: z.string().nullish(),
  weight: numberOrNull(),
  available_quantity: numberOrNull(),
  low_stock_threshold: numberOrNull(),
  max_per_order: numberOrNull(),
}).passthrough();

const BulkEditVariantSchema = prepareFormSchema(BulkEditVariantShape);

const BulkEditFormSchema = z.object({
  variants: z.array(BulkEditVariantSchema),
});

export { BulkEditFormSchema, BulkEditVariantSchema };
