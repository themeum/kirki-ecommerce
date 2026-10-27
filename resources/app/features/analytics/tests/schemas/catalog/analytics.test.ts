import { describe, expect, it } from 'vitest';

import {
  type AnalyticsMetricKey,
  analyticsMetricSchema,
  METRIC_KEYS,
} from '@/features/analytics/schemas/catalog/analytics';

import { buildEmptyStoreOverview, buildOverview, moneyMetric, splitOverview } from '../../fixtures';

const parseKey = <K extends AnalyticsMetricKey>(key: K, overview: Record<string, unknown>) => {
  return analyticsMetricSchema(key).safeParse(splitOverview(overview)[key]);
};

const parsesEveryKey = (overview: Record<string, unknown>) => {
  return METRIC_KEYS.every((key) => parseKey(key, overview).success);
};

describe('analyticsMetricSchema', () => {
  it('accepts the payload of every key served by GET /analytics/metrics/{key}', () => {
    expect(parsesEveryKey(buildOverview())).toBe(true);
  });

  it('keeps the meta and the metrics of a ready response', () => {
    const responses = splitOverview(buildOverview());
    const kpis = analyticsMetricSchema('kpis').parse(responses.kpis);
    const breakdown = analyticsMetricSchema('total_sales_breakdown').parse(
      responses.total_sales_breakdown,
    );
    const fulfillment = analyticsMetricSchema('orders_by_fulfillment_status').parse(
      responses.orders_by_fulfillment_status,
    );

    expect(kpis.meta.granularity).toBe('day');
    expect(kpis.meta).not.toHaveProperty('currencies');
    expect(kpis.data.gross_sales.current_money_object?.display).toBe('$62.00');
    expect(kpis.data.gross_sales.current_money_object?.short_display).toBe('$62.00');
    expect(kpis.meta.amount_example?.short_display).toBe('$20.3K');
    expect(kpis.data.orders.current).toBe(12);
    expect(breakdown.data.rows).toHaveLength(7);
    expect(fulfillment.data.items.map((item) => item.status)).toContain('returned');
  });

  it('rejects a money object without short_display', () => {
    const { short_display: _, ...longOnly } = moneyMetric(6200, 5000, 24).current_money_object!;
    const gross = { ...moneyMetric(6200, 5000, 24), series: [] };
    const valid = buildOverview({ kpis: { gross_sales: gross } });
    const invalid = buildOverview({
      kpis: { gross_sales: { ...gross, current_money_object: longOnly } },
    });

    expect(parseKey('kpis', valid).success).toBe(true);
    expect(parseKey('kpis', invalid).success).toBe(false);
  });

  it('rejects the data of another key', () => {
    const responses = splitOverview(buildOverview());

    expect(analyticsMetricSchema('kpis').safeParse(responses.sales_by_product).success).toBe(false);
  });

  it('accepts a response for a store with no orders (empty values and no comparison change)', () => {
    expect(parsesEveryKey(buildEmptyStoreOverview())).toBe(true);
  });

  it('accepts a response with no comparison', () => {
    const overview = buildOverview({
      top: { compare: null },
      kpis: { gross_sales: { ...moneyMetric(6200, null, null), series: [] } },
    });

    expect(parsesEveryKey(overview)).toBe(true);
  });

  it('accepts an empty change (zero comparison) and an empty Average order value', () => {
    const overview = buildOverview({
      kpis: { average_order_value: { ...moneyMetric(null, null, null), series: [] } },
    });

    expect(parseKey('kpis', overview).success).toBe(true);
  });

  it('ignores fields it does not know, so a newer backend does not break the page', () => {
    expect(parsesEveryKey({ ...buildOverview(), brand_new_field: { a: 1 } })).toBe(true);
  });

  // Scenario: First visit (the response always carries the metrics)
  it('rejects a response without the data', () => {
    const { meta } = splitOverview(buildOverview()).kpis;

    expect(analyticsMetricSchema('kpis').safeParse({ meta }).success).toBe(false);
  });

  it('rejects a response without the meta', () => {
    const { data } = splitOverview(buildOverview()).sales_by_product;

    expect(analyticsMetricSchema('sales_by_product').safeParse({ data }).success).toBe(false);
  });

  it('rejects a money metric whose money object is malformed', () => {
    const overview = buildOverview({
      kpis: {
        gross_sales: {
          current_money_object: { raw: 1 },
          previous_money_object: null,
          change: null,
          series: [],
        },
      },
    });

    expect(parseKey('kpis', overview).success).toBe(false);
  });
});
