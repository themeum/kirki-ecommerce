import { format, isValid, parse } from 'date-fns';

export const DATE_FORMATS = {
  ATOM: "yyyy-MM-dd'T'HH:mm:ssxxx",
  YEAR_MONTH_DAY: 'yyyy/MM/dd',
  HUMAN_READABLE: 'MMMM d, yyyy',
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
  date: Date | null | undefined,
  pattern: string = DATE_FORMATS.DATE_INPUT,
): string | null => {
  if (!date || !isValid(date)) {
    return null;
  }

  return format(date, pattern);
};
