import { hasNoSeriesValues } from '@/features/analytics/lib/chart-points';
import type { AnalyticsCards } from '@/features/analytics/schemas/catalog/analytics';

type EmptyCheckedCard = Exclude<keyof AnalyticsCards, 'inventory_health'>;

const isZero = (value: number | string | null | undefined) => !value || Number(value) === 0;

const CHECKS: { [K in EmptyCheckedCard]: (data: AnalyticsCards[K]) => boolean } = {
  total_sales_over_time: (data) => hasNoSeriesValues(data.series),
  total_sales_breakdown: (data) => data.rows.every((row) => isZero(row.current_money_object?.raw)),
  sales_by_product: (data) => data.items.length === 0,
  sales_by_category: (data) => data.items.length === 0,
  average_order_value_over_time: (data) => hasNoSeriesValues(data.series),
  orders_over_time: (data) => hasNoSeriesValues(data.series),
  orders_by_fulfillment_status: (data) => data.total_orders === 0,
  new_vs_returning_customers: (data) =>
    data.series.every((point) => point.new === 0 && point.returning === 0),
  sales_by_coupon_code: (data) => data.items.length === 0,
  orders_by_time_of_day: (data) => data.current.every((row) => row.every((count) => count === 0)),
  sales_by_location: (data) => data.countries.length === 0,
  sales_by_payment_method: (data) => data.items.length === 0,
  taxes_by_region: (data) => data.items.length === 0,
  shipping_charges_by_method: (data) => data.items.length === 0,
};

const hasNoCardData = <K extends EmptyCheckedCard>(key: K, data: AnalyticsCards[K]) => {
  return CHECKS[key](data);
};

export { hasNoCardData };
export type { EmptyCheckedCard };
