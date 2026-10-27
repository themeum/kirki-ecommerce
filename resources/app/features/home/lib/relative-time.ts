import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
} from 'date-fns';

import { __, sprintf } from '@/wpi18n';

const DAYS_IN_MONTH = 30;
const MONTHS_IN_YEAR = 12;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;

export const formatTimeAgo = (value: string | Date, now: Date = new Date()): string => {
  const date = new Date(value);
  const minutes = differenceInMinutes(now, date);

  if (Number.isNaN(minutes)) {
    return '';
  }

  if (minutes < 1) {
    return __('Just now', 'kirki-ecommerce');
  }

  if (minutes < MINUTES_IN_HOUR) {
    /* translators: %d: number of minutes */
    return sprintf(__('%dm ago', 'kirki-ecommerce'), minutes);
  }

  const hours = differenceInHours(now, date);

  if (hours < HOURS_IN_DAY) {
    /* translators: %d: number of hours */
    return sprintf(__('%dh ago', 'kirki-ecommerce'), hours);
  }

  const days = differenceInDays(now, date);

  if (days < DAYS_IN_MONTH) {
    /* translators: %d: number of days */
    return sprintf(__('%dd ago', 'kirki-ecommerce'), days);
  }

  const months = differenceInMonths(now, date);

  if (months < MONTHS_IN_YEAR) {
    /* translators: %d: number of months */
    return sprintf(__('%dmo ago', 'kirki-ecommerce'), Math.max(months, 1));
  }

  /* translators: %d: number of years */
  return sprintf(__('%dy ago', 'kirki-ecommerce'), differenceInYears(now, date));
};
