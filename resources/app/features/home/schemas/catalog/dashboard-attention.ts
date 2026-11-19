import { z } from 'zod';

import { MoneyObjectSchema } from '@/schemas/shared/api';
import { MediaRefSchema } from '@/schemas/shared/media';

const LowStockItemSchema = z.object({
  variant_id: z.number(),
  product_id: z.number(),
  product_name: z.string(),
  variant_name: z.string(),
  image: MediaRefSchema.nullish(),
  available_quantity: z.number(),
});

const DashboardAttentionSchema = z.object({
  to_ship: z.object({ count: z.number(), late_count: z.number() }),
  to_collect: z.object({
    count: z.number(),
    base_total_money_object: MoneyObjectSchema.extend({ short_display: z.string() }),
  }),
  out_of_stock: z.object({ count: z.number() }),
  low_stock: z.object({ total: z.number(), items: z.array(LowStockItemSchema) }),
});

type DashboardAttention = z.infer<typeof DashboardAttentionSchema>;

export { type DashboardAttention, DashboardAttentionSchema };
