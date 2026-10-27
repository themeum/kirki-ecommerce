import { z } from 'zod';

import { MoneyObjectSchema } from '@/schemas/shared/api';
import { MediaRefSchema } from '@/schemas/shared/media';

const AnalyticsMoneySchema = MoneyObjectSchema.extend({ short_display: z.string() });

const MoneyMetricSchema = z.object({
  current_money_object: AnalyticsMoneySchema.nullish(),
  previous_money_object: AnalyticsMoneySchema.nullish(),
  change: z.number().nullish(),
});

const CountMetricSchema = z.object({
  current: z.number().nullish(),
  previous: z.number().nullish(),
  change: z.number().nullish(),
});

const SeriesPointSchema = z.object({
  date: z.string(),
  label: z.string(),
  span_label: z.string().nullish(),
  value: z.number().nullish(),
  previous_date: z.string().nullish(),
  previous_label: z.string().nullish(),
  previous_span_label: z.string().nullish(),
  previous_value: z.number().nullish(),
});

const MoneyKpiSchema = MoneyMetricSchema.extend({ series: z.array(SeriesPointSchema) });
const CountKpiSchema = CountMetricSchema.extend({ series: z.array(SeriesPointSchema) });

const BreakdownRowSchema = MoneyMetricSchema.extend({ key: z.string() });

const ProductItemSchema = z.object({
  product_id: z.number().nullish(),
  name: z.string(),
  image: MediaRefSchema.nullish(),
  is_deleted: z.boolean().nullish(),
  units_sold: z.number(),
  net_sales_money_object: AnalyticsMoneySchema,
  previous_net_sales_money_object: AnalyticsMoneySchema.nullish(),
  change: z.number().nullish(),
  availability_status: z.string().nullish(),
  track_inventory: z.boolean().nullish(),
  inventory: z.number().nullish(),
});

const CategoryItemSchema = z.object({
  category_id: z.number().nullish(),
  name: z.string(),
  net_sales_money_object: AnalyticsMoneySchema,
  previous_net_sales_money_object: AnalyticsMoneySchema.nullish(),
  change: z.number().nullish(),
});

const FulfillmentItemSchema = z.object({
  status: z.string(),
  count: z.number(),
  percent: z.number(),
});

const CustomerPointSchema = z.object({
  date: z.string(),
  label: z.string(),
  span_label: z.string().nullish(),
  new: z.number(),
  returning: z.number(),
  previous_date: z.string().nullish(),
  previous_label: z.string().nullish(),
  previous_span_label: z.string().nullish(),
  previous_new: z.number().nullish(),
  previous_returning: z.number().nullish(),
});

const CouponItemSchema = z.object({
  code: z.string(),
  orders: z.number(),
  discount_given_money_object: AnalyticsMoneySchema,
  previous_orders: z.number().nullish(),
  change: z.number().nullish(),
});

const PaymentMethodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  orders: z.number(),
  total_sales_money_object: AnalyticsMoneySchema,
  previous_total_sales_money_object: AnalyticsMoneySchema.nullish(),
  change: z.number().nullish(),
});

const TaxRegionItemSchema = z.object({
  country: z.string().nullish(),
  state: z.string().nullish(),
  name: z.string(),
  product_tax_money_object: AnalyticsMoneySchema,
  shipping_tax_money_object: AnalyticsMoneySchema,
  total_tax_money_object: AnalyticsMoneySchema,
  previous_total_tax_money_object: AnalyticsMoneySchema.nullish(),
  change: z.number().nullish(),
});

const ShippingMethodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  orders: z.number(),
  shipping_charges_money_object: AnalyticsMoneySchema,
  previous_shipping_charges_money_object: AnalyticsMoneySchema.nullish(),
  change: z.number().nullish(),
});

const LowestVariantSchema = z.object({
  variant_id: z.number(),
  product_id: z.number().nullish(),
  product_name: z.string(),
  variant_name: z.string().nullish(),
  available_quantity: z.number(),
  status: z.string(),
});

const LocationRowSchema = z.object({
  sales_money_object: AnalyticsMoneySchema,
  sales_change: z.number().nullish(),
  orders: z.number(),
  orders_change: z.number().nullish(),
  customers: z.number(),
  customers_change: z.number().nullish(),
});

const CountryRowSchema = LocationRowSchema.extend({
  code: z.string(),
  numeric_code: z.string().nullish(),
  name: z.string(),
});

const RegionRowSchema = LocationRowSchema.extend({ name: z.string() });

const AnalyticsRegionsSchema = z.object({
  country: z.string(),
  sales: z.array(RegionRowSchema),
  orders: z.array(RegionRowSchema),
  customers: z.array(RegionRowSchema),
});

const HourCountsSchema = z.array(z.array(z.number()).length(24)).length(7);

const AnalyticsCardsSchema = z.object({
  total_sales_over_time: z.object({
    total: MoneyMetricSchema,
    series: z.array(SeriesPointSchema),
  }),
  total_sales_breakdown: z.object({ rows: z.array(BreakdownRowSchema) }),
  sales_by_product: z.object({ items: z.array(ProductItemSchema) }),
  sales_by_category: z.object({ items: z.array(CategoryItemSchema) }),
  average_order_value_over_time: z.object({
    total: MoneyMetricSchema,
    series: z.array(SeriesPointSchema),
  }),
  orders_over_time: z.object({
    total: CountMetricSchema,
    items_ordered: z.number().nullish(),
    series: z.array(SeriesPointSchema),
  }),
  orders_by_fulfillment_status: z.object({
    total_orders: z.number(),
    delivered_percent: z.number(),
    items: z.array(FulfillmentItemSchema),
  }),
  new_vs_returning_customers: z.object({
    total: CountMetricSchema,
    new_total: z.number(),
    returning_total: z.number(),
    series: z.array(CustomerPointSchema),
  }),
  sales_by_coupon_code: z.object({ items: z.array(CouponItemSchema) }),
  orders_by_time_of_day: z.object({
    current: HourCountsSchema,
    previous: HourCountsSchema.nullish(),
  }),
  sales_by_location: z.object({ countries: z.array(CountryRowSchema) }),
  sales_by_payment_method: z.object({ items: z.array(PaymentMethodItemSchema) }),
  taxes_by_region: z.object({ items: z.array(TaxRegionItemSchema) }),
  shipping_charges_by_method: z.object({ items: z.array(ShippingMethodItemSchema) }),
  inventory_health: z.object({
    out_of_stock: z.number(),
    low_stock: z.number(),
    in_stock: z.number(),
    lowest: z.array(LowestVariantSchema),
  }),
});

const AnalyticsKpisSchema = z.object({
  gross_sales: MoneyKpiSchema,
  orders: CountKpiSchema,
  average_order_value: MoneyKpiSchema,
  returning_customer_rate: CountKpiSchema,
  net_sales: MoneyKpiSchema,
  total_sales: MoneyKpiSchema,
  items_ordered: CountKpiSchema,
  discounts: MoneyKpiSchema,
  new_customers: CountKpiSchema,
  customers: CountKpiSchema,
  shipping_charges: MoneyKpiSchema,
});

const AnalyticsMetaSchema = z.object({
  range: z
    .object({
      preset: z.string(),
      from: z.string(),
      to: z.string(),
      days: z.number(),
    })
    .nullish(),
  compare: z.object({ from: z.string(), to: z.string() }).nullish(),
  granularity: z.string().nullish(),
  base_currency_code: z.string().nullish(),
  has_orders: z.boolean().nullish(),
  amount_example: AnalyticsMoneySchema.nullish(),
});

const METRIC_DATA_SCHEMAS = { kpis: AnalyticsKpisSchema, ...AnalyticsCardsSchema.shape };

type AnalyticsMetricKey = keyof typeof METRIC_DATA_SCHEMAS;

const METRIC_KEYS = Object.keys(METRIC_DATA_SCHEMAS) as AnalyticsMetricKey[];

const analyticsMetricSchema = <K extends AnalyticsMetricKey>(key: K) => {
  return z.object({ meta: AnalyticsMetaSchema, data: METRIC_DATA_SCHEMAS[key] });
};

type MoneyObject = z.infer<typeof AnalyticsMoneySchema>;
type SeriesPoint = z.infer<typeof SeriesPointSchema>;
type AnalyticsKpis = z.infer<typeof AnalyticsKpisSchema>;
type AnalyticsCards = z.infer<typeof AnalyticsCardsSchema>;
type AnalyticsMeta = z.infer<typeof AnalyticsMetaSchema>;
type AnalyticsMetric<K extends AnalyticsMetricKey> = {
  meta: AnalyticsMeta;
  data: (AnalyticsCards & { kpis: AnalyticsKpis })[K];
};
type LocationRow = z.infer<typeof LocationRowSchema>;
type CountryRow = z.infer<typeof CountryRowSchema>;
type RegionRow = z.infer<typeof RegionRowSchema>;
type AnalyticsRegions = z.infer<typeof AnalyticsRegionsSchema>;

export { analyticsMetricSchema, AnalyticsRegionsSchema, METRIC_KEYS };
export type {
  AnalyticsCards,
  AnalyticsKpis,
  AnalyticsMeta,
  AnalyticsMetric,
  AnalyticsMetricKey,
  AnalyticsRegions,
  CountryRow,
  LocationRow,
  MoneyObject,
  RegionRow,
  SeriesPoint,
};
