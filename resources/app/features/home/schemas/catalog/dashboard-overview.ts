import { z } from 'zod';

import { OrderListItemSchema } from '@/features/orders';
import { MoneyObjectSchema } from '@/schemas/shared/api';
import { MediaRefSchema } from '@/schemas/shared/media';

const DashboardMoneySchema = MoneyObjectSchema.extend({ short_display: z.string() });

const DashboardMetricsSchema = z.object({
  base_total_sales_money_object: DashboardMoneySchema,
  base_net_sales_money_object: DashboardMoneySchema,
  orders_count: z.number(),
  products_sold: z.number(),
});

const TopProductAvailabilitySchema = z.enum([
  'in_stock',
  'low_stock',
  'out_of_stock',
  'partially_stocked',
]);

const TopProductSchema = z.object({
  product_id: z.number().nullable(),
  product_name: z.string().nullish(),
  image: MediaRefSchema.nullish(),
  units_sold: z.number(),
  base_revenue_money_object: DashboardMoneySchema,
  availability_status: TopProductAvailabilitySchema.nullable(),
  track_inventory: z.boolean(),
  inventory: z.number(),
});

const DashboardOverviewSchema = z.object({
  metrics: DashboardMetricsSchema,
  recent_orders: z.array(OrderListItemSchema),
  top_products: z.array(TopProductSchema),
});

type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
type DashboardMoney = z.infer<typeof DashboardMoneySchema>;
type TopProduct = z.infer<typeof TopProductSchema>;
type DashboardOverview = z.infer<typeof DashboardOverviewSchema>;

export {
  type DashboardMetrics,
  type DashboardMoney,
  type DashboardOverview,
  DashboardOverviewSchema,
  type TopProduct,
};
