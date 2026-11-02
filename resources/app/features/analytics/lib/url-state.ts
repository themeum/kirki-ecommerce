import { isValid, parse } from 'date-fns';

import {
  type CompareKey,
  COMPARISONS,
  RANGE_PRESETS,
  type RangeKey,
} from '@/features/analytics/lib/date-range';

type AnalyticsParams = {
  range: RangeKey;
  from: string | null;
  to: string | null;
  compare: CompareKey;
  compare_from: string | null;
  compare_to: string | null;
};

const DEFAULT_ANALYTICS_PARAMS: AnalyticsParams = {
  range: 'last_30',
  from: null,
  to: null,
  compare: 'previous_period',
  compare_from: null,
  compare_to: null,
};

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const readDay = (value: string | null) => {
  if (!value || !DAY_PATTERN.test(value)) {
    return null;
  }

  return isValid(parse(value, 'yyyy-MM-dd', new Date())) ? value : null;
};

const parseAnalyticsParams = (query: URLSearchParams): AnalyticsParams => {
  const range = query.get('range');
  const compare = query.get('compare');
  const from = readDay(query.get('from'));
  const to = readDay(query.get('to'));
  const compareFrom = readDay(query.get('compare_from'));
  const compareTo = readDay(query.get('compare_to'));
  const params: AnalyticsParams = { ...DEFAULT_ANALYTICS_PARAMS };

  if (range && (RANGE_PRESETS as readonly string[]).includes(range)) {
    params.range = range as RangeKey;
  }

  if (range === 'custom' && from && to) {
    params.range = 'custom';
    params.from = from;
    params.to = to;
  }

  if (compare && (COMPARISONS as readonly string[]).includes(compare) && compare !== 'custom') {
    params.compare = compare as CompareKey;
  }

  if (compare === 'custom' && compareFrom && compareTo) {
    params.compare = 'custom';
    params.compare_from = compareFrom;
    params.compare_to = compareTo;
  }

  return params;
};

const serializeAnalyticsParams = (params: AnalyticsParams): URLSearchParams => {
  const query = new URLSearchParams();

  if (params.range !== DEFAULT_ANALYTICS_PARAMS.range) {
    query.set('range', params.range);
  }

  if (params.range === 'custom' && params.from && params.to) {
    query.set('from', params.from);
    query.set('to', params.to);
  }

  if (params.compare !== DEFAULT_ANALYTICS_PARAMS.compare) {
    query.set('compare', params.compare);
  }

  if (params.compare === 'custom' && params.compare_from && params.compare_to) {
    query.set('compare_from', params.compare_from);
    query.set('compare_to', params.compare_to);
  }

  return query;
};

export { type AnalyticsParams, DEFAULT_ANALYTICS_PARAMS, parseAnalyticsParams, serializeAnalyticsParams };
