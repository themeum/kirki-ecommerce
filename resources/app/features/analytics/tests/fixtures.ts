/**
 * Builders for `GET /analytics/metrics/{key}` responses used by the analytics tests.
 *
 * `buildOverview()` builds every key at once as `meta + kpis + cards`;
 * `splitOverview()` turns it into the `{ meta, data }` response of each key.
 *
 * The shapes follow the "Test contract" section of openspec/changes/analytics-foundation/design.md.
 */

const shortAmount = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const money = (minor: number, code = 'USD', symbol = '$') => ({
  raw: minor / 100,
  display: `${symbol}${(minor / 100).toFixed(2)}`,
  short_display:
    Math.abs(minor) < 100000
      ? `${symbol}${(minor / 100).toFixed(2)}`
      : `${symbol}${shortAmount.format(minor / 100)}`,
  currency: { code, symbol },
});

const moneyMetric = (current: number | null, previous: number | null, change: number | null) => ({
  current_money_object: current === null ? null : money(current),
  previous_money_object: previous === null ? null : money(previous),
  change,
});

const countMetric = (current: number | null, previous: number | null, change: number | null) => ({
  current,
  previous,
  change,
});

const point = (index: number, value: number | null, previousValue: number | null) => ({
  date: `2026-10-0${index + 1}`,
  label: `Oct ${index + 1}`,
  value,
  previous_date: `2026-09-0${index + 1}`,
  previous_label: `Sep ${index + 1}`,
  previous_value: previousValue,
});

const series = (values: (number | null)[], previous: (number | null)[] = []) =>
  values.map((value, index) => point(index, value, previous[index] ?? null));

const countPoint = (index: number, added: number, returning: number) => ({
  date: `2026-10-0${index + 1}`,
  label: `Oct ${index + 1}`,
  new: added,
  returning,
  previous_date: `2026-09-0${index + 1}`,
  previous_label: `Sep ${index + 1}`,
  previous_new: 0,
  previous_returning: 0,
});

const breakdownRow = (
  key: string,
  current: number,
  previous: number | null,
  change: number | null,
) => ({
  key,
  ...moneyMetric(current, previous, change),
});

const FULFILLMENT_STATUSES = [
  'unfulfilled',
  'processing',
  'on-hold',
  'shipped',
  'delivered',
  'returned',
  'cancelled',
];

/** A 7 × 24 grid of order counts, rows Mon to Sun, with the given [weekday, hour, count] cells. */
const hourCounts = (cells: [number, number, number][] = []) => {
  const counts = Array.from({ length: 7 }, () => Array<number>(24).fill(0));

  cells.forEach(([day, hour, count]) => {
    counts[day][hour] = count;
  });

  return counts;
};

const locationRow = (
  sales: number,
  orders: number,
  customers: number,
  changes: [number | null, number | null, number | null] = [null, null, null],
) => ({
  sales_money_object: money(sales),
  sales_change: changes[0],
  orders,
  orders_change: changes[1],
  customers,
  customers_change: changes[2],
});

const country = (
  code: string,
  numericCode: string,
  name: string,
  values: ReturnType<typeof locationRow>,
) => ({ code, numeric_code: numericCode, name, ...values });

const range = { preset: 'last_30', from: '2026-09-15', to: '2026-10-14', days: 30 };
const compare = { from: '2026-08-16', to: '2026-09-14' };

const buildOverview = (
  overrides: {
    top?: Record<string, unknown>;
    kpis?: Record<string, unknown>;
    cards?: Record<string, unknown>;
  } = {},
) => {
  const base = {
    range,
    compare,
    granularity: 'day',
    base_currency_code: 'USD',
    has_orders: true,
    amount_example: money(2034500),
    kpis: {
      gross_sales: {
        ...moneyMetric(6200, 5500, 12.3),
        series: series([1000, 2200, 3000], [900, 1900, 2700]),
      },
      orders: { ...countMetric(12, 12.5, -4), series: series([3, 4, 5], [4, 4, 4]) },
      average_order_value: {
        ...moneyMetric(5200, 5200, 0),
        series: series([5200, 5200, 5200], [5200, 5200, 5200]),
      },
      returning_customer_rate: {
        ...countMetric(33.3, null, null),
        series: series([20, 30, 40], [10, 10, 10]),
      },
      net_sales: {
        ...moneyMetric(5200, 4800, 8.3),
        series: series([900, 1900, 2400], [800, 1700, 2300]),
      },
      total_sales: {
        ...moneyMetric(6601, 6000, 10),
        series: series([1000, 2200, 3401], [900, 1900, 3200]),
      },
      items_ordered: { ...countMetric(30, 28, 7.1), series: series([8, 10, 12], [9, 9, 10]) },
      discounts: {
        ...moneyMetric(1000, 700, 42.9),
        series: series([100, 300, 600], [100, 200, 400]),
      },
      new_customers: { ...countMetric(8, 6, 33.3), series: series([2, 3, 3], [2, 2, 2]) },
      customers: { ...countMetric(10, 9, 11.1), series: series([3, 3, 4], [3, 3, 3]) },
      shipping_charges: {
        ...moneyMetric(800, 750, 6.7),
        series: series([200, 300, 300], [250, 250, 250]),
      },
      ...overrides.kpis,
    },
    cards: {
      total_sales_over_time: {
        total: moneyMetric(6601, 6000, 10),
        series: series([1000, 2200, 3401], [900, 1900, 3200]),
      },
      total_sales_breakdown: {
        rows: [
          breakdownRow('gross_sales', 6200, 5500, 12.7),
          breakdownRow('discounts', 1000, 800, 25),
          breakdownRow('returns', 0, 0, null),
          breakdownRow('net_sales', 5200, 4700, 10.6),
          breakdownRow('shipping', 800, 700, 14.3),
          breakdownRow('taxes', 601, 600, 0.2),
          breakdownRow('total_sales', 6601, 6000, 10),
        ],
      },
      sales_by_product: {
        items: [
          {
            product_id: 7,
            name: 'Hoodie',
            image: null,
            is_deleted: false,
            units_sold: 5,
            net_sales_money_object: money(4100),
            previous_net_sales_money_object: money(3000),
            change: 36.7,
            availability_status: 'low_stock',
            track_inventory: true,
            inventory: 3,
          },
        ],
      },
      sales_by_category: {
        items: [
          {
            category_id: 3,
            name: 'Hoodies',
            net_sales_money_object: money(4100),
            previous_net_sales_money_object: money(3000),
            change: 36.7,
          },
        ],
      },
      average_order_value_over_time: {
        total: moneyMetric(5200, 5200, 0),
        series: series([5200, null, 5200], [5200, 5200, 5200]),
      },
      orders_over_time: {
        total: countMetric(12, 12.5, -4),
        items_ordered: 20,
        series: series([3, 4, 5], [4, 4, 4]),
      },
      orders_by_fulfillment_status: {
        total_orders: 12,
        delivered_percent: 50,
        items: FULFILLMENT_STATUSES.map((status) => ({
          status,
          count: status === 'delivered' ? 6 : status === 'shipped' ? 6 : 0,
          percent: status === 'delivered' || status === 'shipped' ? 50 : 0,
        })),
      },
      new_vs_returning_customers: {
        total: countMetric(9, 8, 12.5),
        new_total: 6,
        returning_total: 3,
        series: [countPoint(0, 2, 1), countPoint(1, 3, 1), countPoint(2, 1, 1)],
      },
      sales_by_coupon_code: {
        items: [
          {
            code: 'FREESHIP50',
            orders: 4,
            discount_given_money_object: money(3200),
            previous_orders: 3,
            change: 33.3,
          },
        ],
      },
      orders_by_time_of_day: {
        current: hourCounts([
          [0, 20, 1],
          [1, 9, 3],
          [1, 10, 3],
          [4, 18, 5],
        ]),
        previous: hourCounts([
          [1, 9, 4],
          [4, 18, 2],
        ]),
      },
      sales_by_location: {
        countries: [
          country('AU', '036', 'Australia', locationRow(537603, 42, 42, [60.5, 44.8, 44.8])),
          country('BD', '050', 'Bangladesh', locationRow(360336, 32, 12, [19.3, 45.5, 45.5])),
          country('CA', '124', 'Canada', locationRow(424545, 36, 36, [-24.3, -10, -10])),
          country('DE', '276', 'Germany', locationRow(567215, 39, 39, [111.2, 117, 117])),
          country('SG', '702', 'Singapore', locationRow(10000, 2, 2)),
          country('US', '840', 'United States', locationRow(1991357, 59, 207, [28.8, 20.4, 28.6])),
        ],
      },
      sales_by_payment_method: {
        items: [
          {
            id: 'stripe',
            name: 'Stripe',
            orders: 209,
            total_sales_money_object: money(2068027),
            previous_total_sales_money_object: money(1519500),
            change: 36.1,
          },
          {
            id: 'klarna',
            name: 'Klarna',
            orders: 27,
            total_sales_money_object: money(285847),
            previous_total_sales_money_object: money(313400),
            change: -8.8,
          },
        ],
      },
      taxes_by_region: {
        items: [
          {
            country: 'US',
            state: 'TX',
            name: 'Texas, United States',
            product_tax_money_object: money(500),
            shipping_tax_money_object: money(101),
            total_tax_money_object: money(601),
            previous_total_tax_money_object: money(481),
            change: 25,
          },
        ],
      },
      shipping_charges_by_method: {
        items: [
          {
            id: 'method-0001',
            name: 'Standard',
            orders: 7,
            shipping_charges_money_object: money(800),
            previous_shipping_charges_money_object: money(889),
            change: -10,
          },
        ],
      },
      inventory_health: {
        out_of_stock: 1,
        low_stock: 2,
        in_stock: 30,
        lowest: [
          {
            variant_id: 11,
            product_id: 7,
            product_name: 'Hoodie',
            variant_name: 'Blue / M',
            available_quantity: -2,
            status: 'out_of_stock',
          },
        ],
      },
      ...overrides.cards,
    },
    ...overrides.top,
  };

  return base;
};

/** A ready response for a store with no orders at all. */
const buildEmptyStoreOverview = () => {
  const zeros = [0, 0, 0];

  return buildOverview({
    top: { has_orders: false },
    kpis: {
      gross_sales: { ...moneyMetric(0, 0, null), series: series(zeros, zeros) },
      orders: { ...countMetric(0, 0, null), series: series(zeros, zeros) },
      average_order_value: {
        ...moneyMetric(null, null, null),
        series: series([null, null, null], zeros),
      },
      returning_customer_rate: {
        ...countMetric(null, null, null),
        series: series([null, null, null], zeros),
      },
      net_sales: { ...moneyMetric(0, 0, null), series: series(zeros, zeros) },
      total_sales: { ...moneyMetric(0, 0, null), series: series(zeros, zeros) },
      items_ordered: { ...countMetric(0, 0, null), series: series(zeros, zeros) },
      discounts: { ...moneyMetric(0, 0, null), series: series(zeros, zeros) },
      new_customers: { ...countMetric(0, 0, null), series: series(zeros, zeros) },
      customers: { ...countMetric(0, 0, null), series: series(zeros, zeros) },
      shipping_charges: { ...moneyMetric(0, 0, null), series: series(zeros, zeros) },
    },
    cards: emptyCards(),
  });
};

/** A ready response for a store with orders but none in the selected range. */
const buildEmptyRangeOverview = () => {
  const overview = buildEmptyStoreOverview();

  return { ...overview, has_orders: true };
};

const emptyCards = () => {
  const zeros = [0, 0, 0];

  return {
    total_sales_over_time: { total: moneyMetric(0, 0, null), series: series(zeros, zeros) },
    total_sales_breakdown: {
      rows: [
        'gross_sales',
        'discounts',
        'returns',
        'net_sales',
        'shipping',
        'taxes',
        'total_sales',
      ].map((key) => breakdownRow(key, 0, 0, null)),
    },
    sales_by_product: { items: [] },
    sales_by_category: { items: [] },
    average_order_value_over_time: {
      total: moneyMetric(null, null, null),
      series: series([null, null, null], zeros),
    },
    orders_over_time: {
      total: countMetric(0, 0, null),
      items_ordered: 0,
      series: series(zeros, zeros),
    },
    orders_by_fulfillment_status: {
      total_orders: 0,
      delivered_percent: 0,
      items: FULFILLMENT_STATUSES.map((status) => ({ status, count: 0, percent: 0 })),
    },
    new_vs_returning_customers: {
      total: countMetric(0, 0, null),
      new_total: 0,
      returning_total: 0,
      series: [countPoint(0, 0, 0), countPoint(1, 0, 0), countPoint(2, 0, 0)],
    },
    sales_by_coupon_code: { items: [] },
    orders_by_time_of_day: { current: hourCounts(), previous: hourCounts() },
    sales_by_location: { countries: [] },
    sales_by_payment_method: { items: [] },
    taxes_by_region: { items: [] },
    shipping_charges_by_method: { items: [] },
    inventory_health: {
      out_of_stock: 1,
      low_stock: 2,
      in_stock: 30,
      lowest: [],
    },
  };
};

type MetricResponse = { meta: Record<string, unknown>; data: unknown };

const splitOverview = (overview: Record<string, unknown>) => {
  const { kpis, cards, ...meta } = overview;
  const responses: Record<string, MetricResponse> = { kpis: { meta, data: kpis } };

  for (const [key, data] of Object.entries(cards as Record<string, unknown>)) {
    responses[key] = { meta, data };
  }

  return responses;
};

export {
  buildEmptyRangeOverview,
  buildEmptyStoreOverview,
  buildOverview,
  countMetric,
  country,
  locationRow,
  money,
  moneyMetric,
  point,
  series,
  splitOverview,
};
