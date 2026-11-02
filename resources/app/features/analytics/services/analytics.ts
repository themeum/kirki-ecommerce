import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import type { AnalyticsParams } from '@/features/analytics/lib/url-state';
import {
  type AnalyticsMetric,
  type AnalyticsMetricKey,
  analyticsMetricSchema,
  AnalyticsRegionsSchema,
  METRIC_KEYS,
} from '@/features/analytics/schemas/catalog/analytics';
import { apiClient } from '@/libs/api';
import { parseData } from '@/services/helpers';

const analyticsKeys = {
  metric: (key: AnalyticsMetricKey, params: AnalyticsParams) =>
    ['AnalyticsMetric', key, params] as const,
  regions: (params: AnalyticsParams, country: string | null) =>
    ['AnalyticsRegions', params, country] as const,
};

const buildQuery = (params: AnalyticsParams) => {
  const query: Record<string, string> = { range: params.range, compare: params.compare };

  if (params.range === 'custom' && params.from && params.to) {
    query.from = params.from;
    query.to = params.to;
  }

  if (params.compare === 'custom' && params.compare_from && params.compare_to) {
    query.compare_from = params.compare_from;
    query.compare_to = params.compare_to;
  }

  return query;
};

const getAnalyticsMetric = <K extends AnalyticsMetricKey>(key: K, params: AnalyticsParams) => {
  return apiClient
    .get(endpoints.ANALYTICS_METRIC(key), { params: buildQuery(params) })
    .then((response) => parseData(analyticsMetricSchema(key), response) as AnalyticsMetric<K>);
};

type AnalyticsMetricQueries = {
  [K in AnalyticsMetricKey]: UseQueryResult<AnalyticsMetric<K>>;
};

const useAnalyticsMetricQueries = (
  params: AnalyticsParams,
  enabledKeys: ReadonlySet<AnalyticsMetricKey>,
) => {
  return useQueries({
    queries: METRIC_KEYS.map((key) => ({
      queryKey: analyticsKeys.metric(key, params),
      queryFn: () => getAnalyticsMetric(key, params),
      staleTime: 0,
      enabled: enabledKeys.has(key),
    })),
    combine: (results) => {
      return Object.fromEntries(
        METRIC_KEYS.map((key, index) => [key, results[index]]),
      ) as AnalyticsMetricQueries;
    },
  });
};

const getAnalyticsRegions = (params: AnalyticsParams, country: string) => {
  return apiClient
    .get(endpoints.ANALYTICS_REGIONS, { params: { ...buildQuery(params), country } })
    .then((response) => parseData(AnalyticsRegionsSchema, response));
};

const useAnalyticsRegionsQuery = (params: AnalyticsParams, country: string | null) => {
  return useQuery({
    queryKey: analyticsKeys.regions(params, country),
    queryFn: () => getAnalyticsRegions(params, country ?? ''),
    enabled: !!country,
  });
};

export { useAnalyticsMetricQueries, useAnalyticsRegionsQuery };
export type { AnalyticsMetricQueries };
