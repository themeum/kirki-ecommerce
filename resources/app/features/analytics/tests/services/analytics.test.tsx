import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_ANALYTICS_PARAMS } from '@/features/analytics/lib/url-state';
import { METRIC_KEYS } from '@/features/analytics/schemas/catalog/analytics';
import { useAnalyticsMetricQueries } from '@/features/analytics/services/analytics';
import { server } from '@/tests/msw/server';

import { buildOverview, splitOverview } from '../fixtures';

const ENDPOINT = 'https://example.test/wp-json/kirki/ecommerce/v1/analytics/metrics/:key';

const createClient = () => {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
};

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const respondWithOverview = (requested: URL[] = []) => {
  const responses = splitOverview(buildOverview());

  server.use(
    http.get(ENDPOINT, ({ request, params }) => {
      requested.push(new URL(request.url));
      return HttpResponse.json({
        success: true,
        message: '',
        data: responses[params.key as string],
      });
    }),
  );
};

const ALL_KEYS = new Set(METRIC_KEYS);

const allSucceeded = (result: { current: ReturnType<typeof useAnalyticsMetricQueries> }) => {
  return METRIC_KEYS.every((key) => result.current[key].isSuccess);
};

describe('useAnalyticsMetricQueries', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('requests every metric key in parallel and parses each response', async () => {
    const requested: URL[] = [];
    respondWithOverview(requested);
    const client = createClient();

    const { result } = renderHook(
      () => useAnalyticsMetricQueries(DEFAULT_ANALYTICS_PARAMS, ALL_KEYS),
      {
        wrapper: createWrapper(client),
      },
    );
    await waitFor(() => expect(allSucceeded(result)).toBe(true));

    expect(requested.map((url) => url.pathname.split('/').pop()).sort()).toEqual(
      [...METRIC_KEYS].sort(),
    );
    expect(result.current.kpis.data?.data.orders.current).toBe(12);
    expect(result.current.kpis.data?.meta.base_currency_code).toBe('USD');
    expect(result.current.total_sales_breakdown.data?.data.rows).toHaveLength(7);
  });

  it('sends the default controls as the query string', async () => {
    const requested: URL[] = [];
    respondWithOverview(requested);
    const client = createClient();

    const { result } = renderHook(
      () => useAnalyticsMetricQueries(DEFAULT_ANALYTICS_PARAMS, ALL_KEYS),
      {
        wrapper: createWrapper(client),
      },
    );
    await waitFor(() => expect(allSucceeded(result)).toBe(true));

    for (const url of requested) {
      expect(url.searchParams.get('range')).toBe('last_30');
      expect(url.searchParams.get('compare')).toBe('previous_period');
      expect(url.searchParams.has('currency')).toBe(false);
    }
  });

  it('sends the custom dates when they are set', async () => {
    const requested: URL[] = [];
    respondWithOverview(requested);
    const client = createClient();
    const params = {
      ...DEFAULT_ANALYTICS_PARAMS,
      range: 'custom',
      from: '2026-09-01',
      to: '2026-09-30',
      compare: 'none',
    } as const;

    const { result } = renderHook(() => useAnalyticsMetricQueries(params, ALL_KEYS), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(allSucceeded(result)).toBe(true));

    expect(requested[0].searchParams.get('range')).toBe('custom');
    expect(requested[0].searchParams.get('from')).toBe('2026-09-01');
    expect(requested[0].searchParams.get('to')).toBe('2026-09-30');
    expect(requested[0].searchParams.get('compare')).toBe('none');
  });

  it('keeps a separate cache entry for every key and every selection', async () => {
    respondWithOverview();
    const client = createClient();
    const wrapper = createWrapper(client);

    const first = renderHook(() => useAnalyticsMetricQueries(DEFAULT_ANALYTICS_PARAMS, ALL_KEYS), {
      wrapper,
    });
    await waitFor(() => expect(allSucceeded(first.result)).toBe(true));
    const second = renderHook(
      () => useAnalyticsMetricQueries({ ...DEFAULT_ANALYTICS_PARAMS, range: 'last_7' }, ALL_KEYS),
      { wrapper },
    );
    await waitFor(() => expect(allSucceeded(second.result)).toBe(true));

    expect(client.getQueryCache().getAll()).toHaveLength(METRIC_KEYS.length * 2);
  });

  // Scenario: One card fails
  it('keeps the other keys when one key fails', async () => {
    const responses = splitOverview(buildOverview());
    server.use(
      http.get(ENDPOINT, ({ params }) => {
        if (params.key === 'taxes_by_region') {
          return HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 });
        }
        return HttpResponse.json({
          success: true,
          message: '',
          data: responses[params.key as string],
        });
      }),
    );
    const client = createClient();

    const { result } = renderHook(
      () => useAnalyticsMetricQueries(DEFAULT_ANALYTICS_PARAMS, ALL_KEYS),
      {
        wrapper: createWrapper(client),
      },
    );
    await waitFor(() => expect(result.current.taxes_by_region.isError).toBe(true));
    await waitFor(() => expect(result.current.kpis.isSuccess).toBe(true));

    expect(result.current.sales_by_product.isSuccess).toBe(true);
  });

  // Scenario: Hidden card is not requested
  it('does not request a key that is not enabled', async () => {
    const requested: URL[] = [];
    respondWithOverview(requested);
    const client = createClient();
    const enabled = new Set(METRIC_KEYS.filter((key) => key !== 'sales_by_coupon_code'));

    const { result } = renderHook(
      () => useAnalyticsMetricQueries(DEFAULT_ANALYTICS_PARAMS, enabled),
      {
        wrapper: createWrapper(client),
      },
    );
    await waitFor(() => expect(result.current.kpis.isSuccess).toBe(true));
    await waitFor(() => expect(requested).toHaveLength(METRIC_KEYS.length - 1));

    expect(requested.map((url) => url.pathname.split('/').pop())).not.toContain(
      'sales_by_coupon_code',
    );
    expect(result.current.sales_by_coupon_code.isError).toBe(false);
    expect(result.current.sales_by_coupon_code.data).toBeUndefined();
  });

  // Scenario: First visit (no preparation step, so no polling)
  it('does not poll', async () => {
    respondWithOverview();
    const client = createClient();

    const { result } = renderHook(
      () => useAnalyticsMetricQueries(DEFAULT_ANALYTICS_PARAMS, ALL_KEYS),
      {
        wrapper: createWrapper(client),
      },
    );
    await waitFor(() => expect(allSucceeded(result)).toBe(true));

    for (const query of client.getQueryCache().getAll()) {
      expect(query.observers[0].options.refetchInterval).toBeUndefined();
    }
  });
});
