import { z } from 'zod';

import { numberOrNull, prepareFormSchema, requiredWhen } from '@/libs/zod';
import { moneyAmount } from '@/schemas/forms/shared/validators';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const BulkEditVariantShape = z.object({
  id: z.number(),
  base_price: moneyAmount.nullish(),
  base_sale_price: requiredWhen(
    moneyAmount.nullish(),
    (values) =>
      isDefined(values.base_sale_price) &&
      isDefined(values.base_price) &&
      Number(values.base_sale_price) > Number(values.base_price),
    __('The sale price cannot be greater than the regular price.', 'kirki-ecommerce'),
  ),
  base_cost_of_goods: moneyAmount.nullish(),
  sku: z.string().nullish(),
  weight: moneyAmount.nullish(),
  available_quantity: numberOrNull(),
  low_stock_threshold: numberOrNull(),
  max_per_order: numberOrNull(),
}).passthrough();

const BulkEditVariantSchema = prepareFormSchema(BulkEditVariantShape);

const BulkEditFormSchema = z.object({
  variants: z.array(BulkEditVariantSchema),
});

export { BulkEditFormSchema, BulkEditVariantSchema };
