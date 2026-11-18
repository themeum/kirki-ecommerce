import { z } from 'zod';

import { MoneyObjectSchema } from '@/schemas/shared/api';

const FirstSaleOrderSchema = z.object({
  id: z.number(),
  order_number: z.string(),
  customer_name: z.string().nullable(),
  base_total_money_object: MoneyObjectSchema,
});

const FirstSaleSchema = z.object({
  is_visible: z.boolean(),
  should_celebrate: z.boolean(),
  order: FirstSaleOrderSchema.nullable(),
});

type FirstSale = z.infer<typeof FirstSaleSchema>;
type FirstSaleOrder = z.infer<typeof FirstSaleOrderSchema>;

export { type FirstSale, type FirstSaleOrder, FirstSaleSchema };
