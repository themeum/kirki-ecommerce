import { describe, expect, it, vi } from 'vitest';

import {
  findRangePreset,
  formatRangeDates,
  getCompareLabel,
  getRangePresetLabel,
  RANGE_PRESETS,
  resolveComparisonRange,
  resolvePresetRange,
} from '@/features/analytics/lib/date-range';

vi.mock('@/wpi18n', () => ({
  __: (text: string) => text,
  sprintf: (format: string, ...args: unknown[]) => {
    let index = 0;
    return format.replace(/%[sd]/g, () => String(args[index++]));
  },
}));

// Oct 14, 2026 is a Wednesday.
const today = new Date(2026, 9, 14, 12, 0, 0);

describe('RANGE_PRESETS', () => {
  it('lists the presets in the order the date control shows them', () => {
    expect(RANGE_PRESETS).toEqual([
      'today',
      'yesterday',
      'last_7',
      'last_30',
      'last_90',
      'last_12_months',
      'month_to_date',
      'year_to_date',
    ]);
  });
});

describe('getRangePresetLabel', () => {
  it.each([
    ['today', 'Today'],
    ['yesterday', 'Yesterday'],
    ['last_7', 'Last 7 days'],
    ['last_30', 'Last 30 days'],
    ['last_90', 'Last 90 days'],
    ['last_12_months', 'Last 12 months'],
    ['month_to_date', 'Month to date'],
    ['year_to_date', 'Year to date'],
    ['custom', 'Custom'],
  ] as const)('names %s "%s"', (preset, label) => {
    expect(getRangePresetLabel(preset)).toBe(label);
  });
});

describe('getCompareLabel', () => {
  it.each([
    ['previous_period', 'Previous period'],
    ['previous_year', 'Previous year'],
    ['custom', 'Custom'],
    ['none', 'No comparison'],
  ] as const)('names %s "%s"', (compare, label) => {
    expect(getCompareLabel(compare)).toBe(label);
  });
});

describe('resolvePresetRange', () => {
  it.each([
    ['today', '2026-10-14', '2026-10-14'],
    ['yesterday', '2026-10-13', '2026-10-13'],
    ['last_7', '2026-10-08', '2026-10-14'],
    ['last_30', '2026-09-15', '2026-10-14'],
    ['last_90', '2026-07-17', '2026-10-14'],
    ['last_12_months', '2025-10-15', '2026-10-14'],
    ['month_to_date', '2026-10-01', '2026-10-14'],
    ['year_to_date', '2026-01-01', '2026-10-14'],
  ] as const)('resolves %s to %s - %s', (preset, from, to) => {
    expect(resolvePresetRange(preset, today)).toEqual({ from, to });
  });

  it('includes the start day and the end day (Last 30 days is 30 days)', () => {
    const { from, to } = resolvePresetRange('last_30', today);
    const days =
      (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000 +
      1;

    expect(days).toBe(30);
  });

  it('starts the 12 month range the day after the same date one year ago', () => {
    expect(resolvePresetRange('last_12_months', new Date(2028, 1, 29))).toEqual({
      from: '2027-03-01',
      to: '2028-02-29',
    });
  });
});

describe('formatRangeDates', () => {
  it('shows one day as a single date', () => {
    expect(formatRangeDates('2026-10-14', '2026-10-14')).toBe('Oct 14, 2026');
  });

  it('shows the month once when both dates are in the same month', () => {
    expect(formatRangeDates('2026-10-08', '2026-10-14')).toBe('Oct 8 – 14, 2026');
  });

  it('shows the year once when both dates are in the same year', () => {
    expect(formatRangeDates('2026-09-15', '2026-10-14')).toBe('Sep 15 – Oct 14, 2026');
  });

  it('shows both years when the range crosses a year', () => {
    expect(formatRangeDates('2025-10-15', '2026-10-14')).toBe('Oct 15, 2025 – Oct 14, 2026');
  });
});

describe('resolveComparisonRange', () => {
  it.each([
    ['previous_period', '2026-09-15', '2026-10-14', '2026-08-16', '2026-09-14'],
    ['previous_period', '2026-10-08', '2026-10-14', '2026-10-01', '2026-10-07'],
    ['previous_year', '2026-10-08', '2026-10-14', '2025-10-08', '2025-10-14'],
    ['previous_year', '2028-02-29', '2028-02-29', '2027-02-28', '2027-02-28'],
  ] as const)('resolves %s of %s - %s to %s - %s', (compare, from, to, compareFrom, compareTo) => {
    expect(resolveComparisonRange(compare, { from, to })).toEqual({
      from: compareFrom,
      to: compareTo,
    });
  });

  it.each(['custom', 'none'] as const)('resolves nothing for %s', (compare) => {
    expect(resolveComparisonRange(compare, { from: '2026-10-08', to: '2026-10-14' })).toBeNull();
  });
});

describe('findRangePreset', () => {
  it('finds the preset whose range matches', () => {
    expect(findRangePreset({ from: '2026-10-08', to: '2026-10-14' }, today)).toBe('last_7');
  });

  it('finds nothing for a range that matches no preset', () => {
    expect(findRangePreset({ from: '2026-09-07', to: '2026-09-15' }, today)).toBeNull();
  });
});
