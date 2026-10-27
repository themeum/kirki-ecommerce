import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ANALYTICS_PARAMS,
  parseAnalyticsParams,
  serializeAnalyticsParams,
} from '@/features/analytics/lib/url-state';

describe('DEFAULT_ANALYTICS_PARAMS', () => {
  it('is Last 30 days and Previous period', () => {
    expect(DEFAULT_ANALYTICS_PARAMS).toEqual({
      range: 'last_30',
      from: null,
      to: null,
      compare: 'previous_period',
      compare_from: null,
      compare_to: null,
    });
  });
});

describe('parseAnalyticsParams', () => {
  it('returns the defaults for an empty query', () => {
    expect(parseAnalyticsParams(new URLSearchParams(''))).toEqual(DEFAULT_ANALYTICS_PARAMS);
  });

  it('reads a preset and a comparison', () => {
    const params = parseAnalyticsParams(new URLSearchParams('range=year_to_date&compare=none'));

    expect(params).toEqual({
      ...DEFAULT_ANALYTICS_PARAMS,
      range: 'year_to_date',
      compare: 'none',
    });
  });

  it('ignores a currency from an old link', () => {
    expect(parseAnalyticsParams(new URLSearchParams('currency=EUR'))).toEqual(
      DEFAULT_ANALYTICS_PARAMS,
    );
  });

  it('reads a custom range with its dates', () => {
    const params = parseAnalyticsParams(
      new URLSearchParams('range=custom&from=2026-09-01&to=2026-09-30'),
    );

    expect(params).toMatchObject({ range: 'custom', from: '2026-09-01', to: '2026-09-30' });
  });

  it('reads a custom comparison with its dates', () => {
    const params = parseAnalyticsParams(
      new URLSearchParams('compare=custom&compare_from=2026-06-01&compare_to=2026-06-30'),
    );

    expect(params).toMatchObject({
      compare: 'custom',
      compare_from: '2026-06-01',
      compare_to: '2026-06-30',
    });
  });

  it('falls back to the default for an unknown preset or comparison', () => {
    const params = parseAnalyticsParams(
      new URLSearchParams('range=last_1000_years&compare=sideways'),
    );

    expect(params.range).toBe('last_30');
    expect(params.compare).toBe('previous_period');
  });

  it('falls back to the default range for a custom range without valid dates', () => {
    expect(
      parseAnalyticsParams(new URLSearchParams('range=custom&from=nope&to=2026-09-30')).range,
    ).toBe('last_30');
    expect(parseAnalyticsParams(new URLSearchParams('range=custom')).range).toBe('last_30');
  });
});

describe('serializeAnalyticsParams', () => {
  it('writes nothing for the defaults', () => {
    expect(serializeAnalyticsParams(DEFAULT_ANALYTICS_PARAMS).toString()).toBe('');
  });

  it('writes only what differs from the defaults', () => {
    const query = serializeAnalyticsParams({
      ...DEFAULT_ANALYTICS_PARAMS,
      range: 'last_7',
    });

    expect(query.get('range')).toBe('last_7');
    expect(query.has('compare')).toBe(false);
    expect(query.has('from')).toBe(false);
  });

  it('writes the dates of a custom range', () => {
    const query = serializeAnalyticsParams({
      ...DEFAULT_ANALYTICS_PARAMS,
      range: 'custom',
      from: '2026-09-01',
      to: '2026-09-30',
    });

    expect(query.get('range')).toBe('custom');
    expect(query.get('from')).toBe('2026-09-01');
    expect(query.get('to')).toBe('2026-09-30');
  });

  it('round-trips every kind of selection', () => {
    const selections = [
      { ...DEFAULT_ANALYTICS_PARAMS, range: 'year_to_date', compare: 'none' },
      {
        ...DEFAULT_ANALYTICS_PARAMS,
        range: 'custom',
        from: '2026-09-01',
        to: '2026-09-30',
        compare: 'previous_year',
      },
      {
        ...DEFAULT_ANALYTICS_PARAMS,
        compare: 'custom',
        compare_from: '2026-06-01',
        compare_to: '2026-06-30',
      },
    ] as const;

    for (const selection of selections) {
      expect(parseAnalyticsParams(serializeAnalyticsParams(selection))).toEqual(selection);
    }
  });
});
