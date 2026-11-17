import { formatNumber, formatPercent, moneyValue } from '@/features/analytics/lib/format';
import type { AmountFormat, KpiKey } from '@/features/analytics/lib/layout';
import type { AnalyticsKpis } from '@/features/analytics/schemas/catalog/analytics';

type KpiValue = { text: string; title?: string };

const KPI_VALUE_FORMATTERS: {
  [K in KpiKey]: (metric: AnalyticsKpis[K], format: AmountFormat) => KpiValue;
} = {
  gross_sales: (metric, format) => moneyValue(metric.current_money_object, format),
  orders: (metric) => ({ text: formatNumber(metric.current) }),
  average_order_value: (metric, format) => moneyValue(metric.current_money_object, format),
  returning_customer_rate: (metric) => ({ text: formatPercent(metric.current) }),
  net_sales: (metric, format) => moneyValue(metric.current_money_object, format),
  total_sales: (metric, format) => moneyValue(metric.current_money_object, format),
  items_ordered: (metric) => ({ text: formatNumber(metric.current) }),
  discounts: (metric, format) => moneyValue(metric.current_money_object, format),
  new_customers: (metric) => ({ text: formatNumber(metric.current) }),
  customers: (metric) => ({ text: formatNumber(metric.current) }),
  shipping_charges: (metric, format) => moneyValue(metric.current_money_object, format),
};

const formatKpiValue = <K extends KpiKey>(key: K, kpis: AnalyticsKpis, format: AmountFormat) => {
  const formatter = KPI_VALUE_FORMATTERS[key];

  return formatter(kpis[key], format);
};

export { formatKpiValue };
