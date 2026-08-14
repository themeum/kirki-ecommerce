import {
  addDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

import { WEEK_STARTS_ON } from '@/libs/date';
import { __ } from '@/wpi18n';

type DateRangePresetKey =
  | 'today'
  | 'yesterday'
  | 'tomorrow'
  | 'last-7-days'
  | 'last-30-days'
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'last-year';

type DateRangePresetsPosition = 'left' | 'right' | 'bottom';

type PresetRange = {
  from: Date;
  to: Date;
};

type DateRangePreset = {
  key: DateRangePresetKey;
  label: string;
  getRange: (today: Date) => PresetRange;
};

const weekOptions = { weekStartsOn: WEEK_STARTS_ON } as const;

const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    key: 'today',
    label: __('Today', 'kirki-ecommerce'),
    getRange: (today) => ({ from: today, to: today }),
  },
  {
    key: 'yesterday',
    label: __('Yesterday', 'kirki-ecommerce'),
    getRange: (today) => ({ from: subDays(today, 1), to: subDays(today, 1) }),
  },
  {
    key: 'tomorrow',
    label: __('Tomorrow', 'kirki-ecommerce'),
    getRange: (today) => ({ from: addDays(today, 1), to: addDays(today, 1) }),
  },
  {
    key: 'last-7-days',
    label: __('Last 7 days', 'kirki-ecommerce'),
    getRange: (today) => ({ from: subDays(today, 6), to: today }),
  },
  {
    key: 'last-30-days',
    label: __('Last 30 days', 'kirki-ecommerce'),
    getRange: (today) => ({ from: subDays(today, 29), to: today }),
  },
  {
    key: 'this-week',
    label: __('This week', 'kirki-ecommerce'),
    getRange: (today) => ({
      from: startOfWeek(today, weekOptions),
      to: endOfWeek(today, weekOptions),
    }),
  },
  {
    key: 'last-week',
    label: __('Last week', 'kirki-ecommerce'),
    getRange: (today) => ({
      from: startOfWeek(subWeeks(today, 1), weekOptions),
      to: endOfWeek(subWeeks(today, 1), weekOptions),
    }),
  },
  {
    key: 'this-month',
    label: __('This month', 'kirki-ecommerce'),
    getRange: (today) => ({ from: startOfMonth(today), to: endOfMonth(today) }),
  },
  {
    key: 'last-month',
    label: __('Last month', 'kirki-ecommerce'),
    getRange: (today) => ({
      from: startOfMonth(subMonths(today, 1)),
      to: endOfMonth(subMonths(today, 1)),
    }),
  },
  {
    key: 'this-year',
    label: __('This year', 'kirki-ecommerce'),
    getRange: (today) => ({ from: startOfYear(today), to: endOfYear(today) }),
  },
  {
    key: 'last-year',
    label: __('Last year', 'kirki-ecommerce'),
    getRange: (today) => ({
      from: startOfYear(subYears(today, 1)),
      to: endOfYear(subYears(today, 1)),
    }),
  },
];

/**
 * Resolve the picker's `presets` prop into the presets to render.
 *
 * @param presets True for every preset, or the keys to show in the given order.
 *
 * @returns Presets to render, empty when presets are switched off.
 */
const resolveRangePresets = (
  presets: boolean | DateRangePresetKey[],
): DateRangePreset[] => {
  if (presets === true) {
    return DATE_RANGE_PRESETS;
  }

  if (!presets) {
    return [];
  }

  return presets
    .map((key) => DATE_RANGE_PRESETS.find((preset) => preset.key === key))
    .filter((preset): preset is DateRangePreset => Boolean(preset));
};

/**
 * Pull a preset range inside the calendar's navigation bounds.
 *
 * @param range Range produced by the preset.
 * @param startDate Earliest selectable date.
 * @param endDate Latest selectable date.
 *
 * @returns Clamped range, or null when the range falls entirely out of bounds.
 */
const clampPresetRange = (
  range: PresetRange,
  startDate: Date | null,
  endDate: Date | null,
): PresetRange | null => {
  if (startDate && range.to < startDate) {
    return null;
  }

  if (endDate && range.from > endDate) {
    return null;
  }

  return {
    from: startDate && range.from < startDate ? startDate : range.from,
    to: endDate && range.to > endDate ? endDate : range.to,
  };
};

export { clampPresetRange, DATE_RANGE_PRESETS, resolveRangePresets };
export type {
  DateRangePreset,
  DateRangePresetKey,
  DateRangePresetsPosition,
  PresetRange,
};
