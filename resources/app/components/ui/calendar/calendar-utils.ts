import type { Matcher } from 'react-day-picker';

import { parseDateValue } from '@/libs/date';

/**
 * Resolve the picker's min/max date strings into the calendar's navigation
 * bounds and the matchers that disable out-of-bounds days.
 *
 * @param minDate Earliest selectable date.
 * @param maxDate Latest selectable date.
 *
 * @returns Parsed bounds and disabled-day matchers.
 */
const getDateBounds = (
  minDate: string | null | undefined,
  maxDate: string | null | undefined,
) => {
  const startDate = parseDateValue(minDate);
  const endDate = parseDateValue(maxDate);
  const disabledDays: Matcher[] = [];

  if (startDate) {
    disabledDays.push({ before: startDate });
  }

  if (endDate) {
    disabledDays.push({ after: endDate });
  }

  return { startDate, endDate, disabledDays };
};

export { getDateBounds };
