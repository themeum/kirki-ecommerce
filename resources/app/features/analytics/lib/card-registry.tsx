import type { ReactNode } from 'react';

import AverageOrderValueOverTimeCard from '@/features/analytics/components/cards/average-order-value-over-time-card';
import FulfillmentStatusCard from '@/features/analytics/components/cards/fulfillment-status-card';
import InventoryHealthCard from '@/features/analytics/components/cards/inventory-health-card';
import NewVsReturningCustomersCard from '@/features/analytics/components/cards/new-vs-returning-customers-card';
import OrdersByTimeOfDayCard from '@/features/analytics/components/cards/orders-by-time-of-day-card';
import OrdersOverTimeCard from '@/features/analytics/components/cards/orders-over-time-card';
import {
  SalesByCouponCodeCard,
  SalesByPaymentMethodCard,
  ShippingChargesByMethodCard,
  TaxesByRegionCard,
} from '@/features/analytics/components/cards/ranked-list-cards';
import SalesByCategoryCard from '@/features/analytics/components/cards/sales-by-category-card';
import SalesByLocationCard from '@/features/analytics/components/cards/sales-by-location-card';
import SalesByProductCard from '@/features/analytics/components/cards/sales-by-product-card';
import TotalSalesBreakdownCard from '@/features/analytics/components/cards/total-sales-breakdown-card';
import TotalSalesOverTimeCard from '@/features/analytics/components/cards/total-sales-over-time-card';
import { type EmptyCheckedCard, hasNoCardData } from '@/features/analytics/lib/empty-cards';
import type { CardKey } from '@/features/analytics/lib/layout';
import {
  createCompactMinorFormatter,
  createMinorFormatter,
} from '@/features/analytics/lib/money-format';
import type { AnalyticsParams } from '@/features/analytics/lib/url-state';
import type {
  AnalyticsCards,
  AnalyticsMeta,
  AnalyticsMetric,
} from '@/features/analytics/schemas/catalog/analytics';

type CardSize = 'half' | 'full';

type CardEntry<K extends CardKey> = {
  size: CardSize;
  render: (
    data: AnalyticsMetric<K>['data'],
    meta: AnalyticsMeta,
    params: AnalyticsParams,
  ) => ReactNode;
};

type CardRegistry = { [K in CardKey]: CardEntry<K> };

const sharedCardProps = (meta: AnalyticsMeta) => {
  const currencyCode = meta.base_currency_code ?? 'USD';

  return {
    formatMinor: createMinorFormatter(currencyCode),
    formatMinorShort: createCompactMinorFormatter(currencyCode),
    range: meta.range ? { from: meta.range.from, to: meta.range.to } : null,
    compareRange: meta.compare ?? null,
  };
};

const isEmpty = <K extends EmptyCheckedCard>(
  key: K,
  data: AnalyticsCards[K],
  meta: AnalyticsMeta,
) => {
  return meta.has_orders === false || hasNoCardData(key, data);
};

const CARD_REGISTRY: CardRegistry = {
  total_sales_over_time: {
    size: 'full',
    render: (data, meta) => (
      <TotalSalesOverTimeCard
        data={data}
        isEmpty={isEmpty('total_sales_over_time', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  total_sales_breakdown: {
    size: 'half',
    render: (data, meta) => (
      <TotalSalesBreakdownCard
        data={data}
        isEmpty={isEmpty('total_sales_breakdown', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  sales_by_product: {
    size: 'half',
    render: (data, meta) => (
      <SalesByProductCard
        data={data}
        isEmpty={isEmpty('sales_by_product', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  sales_by_category: {
    size: 'half',
    render: (data, meta) => (
      <SalesByCategoryCard
        data={data}
        isEmpty={isEmpty('sales_by_category', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  average_order_value_over_time: {
    size: 'half',
    render: (data, meta) => (
      <AverageOrderValueOverTimeCard
        data={data}
        isEmpty={isEmpty('average_order_value_over_time', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  orders_over_time: {
    size: 'half',
    render: (data, meta) => (
      <OrdersOverTimeCard
        data={data}
        isEmpty={isEmpty('orders_over_time', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  orders_by_fulfillment_status: {
    size: 'half',
    render: (data, meta) => (
      <FulfillmentStatusCard
        data={data}
        isEmpty={isEmpty('orders_by_fulfillment_status', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  new_vs_returning_customers: {
    size: 'half',
    render: (data, meta) => (
      <NewVsReturningCustomersCard
        data={data}
        isEmpty={isEmpty('new_vs_returning_customers', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  sales_by_coupon_code: {
    size: 'half',
    render: (data, meta) => (
      <SalesByCouponCodeCard
        data={data}
        isEmpty={isEmpty('sales_by_coupon_code', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  orders_by_time_of_day: {
    size: 'full',
    render: (data, meta) => (
      <OrdersByTimeOfDayCard
        data={data}
        isEmpty={isEmpty('orders_by_time_of_day', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  sales_by_location: {
    size: 'full',
    render: (data, meta, params) => (
      <SalesByLocationCard
        data={data}
        isEmpty={isEmpty('sales_by_location', data, meta)}
        params={params}
        {...sharedCardProps(meta)}
      />
    ),
  },
  sales_by_payment_method: {
    size: 'half',
    render: (data, meta) => (
      <SalesByPaymentMethodCard
        data={data}
        isEmpty={isEmpty('sales_by_payment_method', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  taxes_by_region: {
    size: 'half',
    render: (data, meta) => (
      <TaxesByRegionCard
        data={data}
        isEmpty={isEmpty('taxes_by_region', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  shipping_charges_by_method: {
    size: 'half',
    render: (data, meta) => (
      <ShippingChargesByMethodCard
        data={data}
        isEmpty={isEmpty('shipping_charges_by_method', data, meta)}
        {...sharedCardProps(meta)}
      />
    ),
  },
  inventory_health: {
    size: 'half',
    render: (data) => <InventoryHealthCard data={data} />,
  },
};

export { CARD_REGISTRY };
export type { CardEntry, CardSize };
