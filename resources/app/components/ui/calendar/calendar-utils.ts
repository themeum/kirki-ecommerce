import type { Matcher } from 'react-day-picker';

import { toValidDate } from '@/libs/date';

/**
 * Resolve the picker's min/max dates into the calendar's navigation bounds and
 * the matchers that disable out-of-bounds days.
 *
 * @param minDate Earliest selectable date.
 * @param maxDate Latest selectable date.
 *
 * @returns Bounds and disabled-day matchers.
 */
const getDateBounds = (
  minDate?: Date | null,
  maxDate?: Date | null,
) => {
  const startDate = toValidDate(minDate);
  const endDate = toValidDate(maxDate);
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
