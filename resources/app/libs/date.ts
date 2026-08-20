import { format, isValid, parse } from 'date-fns';

export const DATE_FORMATS = {
  ATOM: "yyyy-MM-dd'T'HH:mm:ssxxx",
  YEAR_MONTH_DAY: 'yyyy/MM/dd',
  HUMAN_READABLE: 'MMMM d, yyyy',
  HUMAN_READABLE_SHORT: 'd MMM, yy',
  HUMAN_READABLE_WITH_TIME: 'MMMM d, yyyy HH:mm a',
  DATE_TIME_INPUT: 'yyyy-MM-dd HH:mm',
  DATE_INPUT: 'yyyy-MM-dd',
  TIME_INPUT: 'HH:mm',
} as const;

export const START_OF_DAY_TIME = '00:00';
export const END_OF_DAY_TIME = '23:59';

export const WEEK_STARTS_ON = 0;

/**
 * Convert a formatted date string into a Date, or null when it cannot be parsed.
 *
 * @param value Formatted date string.
 * @param pattern date-fns pattern the value is expected to match.
 *
 * @returns Parsed date, or null.
 */
export const parseDateValue = (
  value: string | null | undefined,
  pattern: string = DATE_FORMATS.DATE_INPUT,
): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = parse(value, pattern, new Date());

  return isValid(parsed) ? parsed : null;
};

/**
 * Convert a Date into a formatted date string, or null when it is not a valid date.
 *
 * @param date Date to format.
 * @param pattern date-fns pattern to format with.
 *
 * @returns Formatted string, or null.
 */
export const formatDateValue = (
  date?: Date | null,
  pattern: string = DATE_FORMATS.DATE_INPUT,
): string | null => {
  if (!date || !isValid(date)) {
    return null;
  }

  return format(date, pattern);
};

/** Formats to the same ATOM string the wire layer expects — no Date object survives into the payload. */
export const formatAtomDateTime = (date?: Date | null): string | null =>
  formatDateValue(date, DATE_FORMATS.ATOM);

export const splitIsoDateTime = (iso?: string | null): { date: string; time: string } => {
  if (!iso) {
    return { date: '', time: '' };
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }

  return {
    date: format(parsed, DATE_FORMATS.DATE_INPUT),
    time: format(parsed, DATE_FORMATS.TIME_INPUT),
  };
};

export const mergeDateAndTime = (date: string, time: string): Date | null => {
  if (!date || !time) {
    return null;
  }

  const merged = new Date(`${date}T${time}`);

  return Number.isNaN(merged.getTime()) ? null : merged;
};

export const toValidDate = (value?: Date | null): Date | null => {
  if (!value || !isValid(value)) {
    return null;
  }

  return value;
};
