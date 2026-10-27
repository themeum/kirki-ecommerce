import { describe, expect, it } from 'vitest';

import { DashboardOverviewSchema } from '@/features/home/schemas/catalog/dashboard-overview';

const money = (raw: number, code = 'USD') => ({
  raw,
  display: `$${raw.toFixed(2)}`,
  currency: { code, symbol: '$' },
});

const shortMoney = (raw: number) => ({ ...money(raw), short_display: `$${raw.toFixed(2)}` });

const recentOrder = {
  id: 12,
  uuid: 'a1b2c3',
  order_number: '#1012',
  invoice_number: null,
  customer_id: null,
  customer_name: 'Ada Lovelace',
  customer_email: 'ada@example.com',
  is_manual: false,
  quantity: 2,
  invoiced_total: 25,
  invoiced_total_money_object: money(25),
  base_total: 25,
  base_total_money_object: money(25),
  status: 'pending',
  fulfillment_status: 'unfulfilled',
  is_refund_initiated: false,
  payment_status: 'unpaid',
  payment_provider: 'cash_on_delivery',
  payment_provider_name: 'Cash on Delivery',
  payment_provider_icon: null,
  payment_provider_is_offline: true,
  shipping_method: null,
  shipping_method_name: null,
  created_at: '2026-10-14 09:30:00',
};

describe('DashboardOverviewSchema', () => {
  it('accepts the payload served by GET /dashboard/overview', () => {
    const payload = {
      metrics: {
        base_total_sales: 120,
        base_total_sales_money_object: shortMoney(120),
        base_net_sales: 80,
        base_net_sales_money_object: shortMoney(80),
        orders_count: 1,
        products_sold: 2,
      },
      recent_orders: [recentOrder],
      top_products: [
        {
          product_id: 7,
          product_name: 'T-shirt',
          image: null,
          units_sold: 5,
          base_revenue: 50,
          base_revenue_money_object: shortMoney(50),
          availability_status: 'in_stock',
          track_inventory: true,
          inventory: 59,
        },
        {
          product_id: null,
          product_name: 'Retired mug',
          image: null,
          units_sold: 1,
          base_revenue: 10,
          base_revenue_money_object: shortMoney(10),
          availability_status: null,
          track_inventory: false,
          inventory: 0,
        },
      ],
    };

    const overview = DashboardOverviewSchema.parse(payload);

    expect(overview.metrics.orders_count).toBe(1);
    expect(overview.recent_orders[0]?.payment_status).toBe('unpaid');
    expect(overview.top_products.map(({ product_id }) => product_id)).toEqual([7, null]);
  });

  it('accepts an empty store', () => {
    const payload = {
      metrics: {
        base_total_sales_money_object: shortMoney(0),
        base_net_sales_money_object: shortMoney(0),
        orders_count: 0,
        products_sold: 0,
      },
      recent_orders: [],
      top_products: [],
    };

    expect(DashboardOverviewSchema.parse(payload)).toEqual(payload);
  });

  it('rejects metrics without a money object', () => {
    const payload = {
      metrics: { orders_count: 0, products_sold: 0 },
      recent_orders: [],
      top_products: [],
    };

    expect(DashboardOverviewSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects a metric money object without a short display', () => {
    const payload = {
      metrics: {
        base_total_sales_money_object: money(0),
        base_net_sales_money_object: shortMoney(0),
        orders_count: 0,
        products_sold: 0,
      },
      recent_orders: [],
      top_products: [],
    };

    expect(DashboardOverviewSchema.safeParse(payload).success).toBe(false);
  });
});
