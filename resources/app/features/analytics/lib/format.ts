import type { AmountFormat } from '@/features/analytics/lib/layout';
import type { MoneyObject } from '@/features/analytics/schemas/catalog/analytics';

const EMPTY_VALUE = '—';

const numberFormat = new Intl.NumberFormat('en-US');
const compactNumberFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatMoney = (money: MoneyObject | null | undefined, format: AmountFormat) => {
  if (!money) {
    return EMPTY_VALUE;
  }

  return format === 'short' ? money.short_display : money.display;
};

/**
 * Give the text of a money amount, and in Short mode the long amount as its
 * hover title when the two are different.
 */
const moneyValue = (money: MoneyObject | null | undefined, format: AmountFormat) => {
  const text = formatMoney(money, format);
  const title = format === 'short' && money && money.display !== text ? money.display : undefined;

  return { text, title };
};

const formatNumber = (value: number | null | undefined) => {
  return value === null || value === undefined ? EMPTY_VALUE : numberFormat.format(value);
};

const formatCompactNumber = (value: number) => compactNumberFormat.format(value);

const formatPercent = (value: number | null | undefined) => {
  return value === null || value === undefined ? EMPTY_VALUE : `${value.toFixed(1)}%`;
};

export { EMPTY_VALUE, formatCompactNumber, formatMoney, formatNumber, formatPercent, moneyValue };
