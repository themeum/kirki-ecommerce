import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  formatNumber,
  formatPercent,
  moneyValue,
} from '@/features/analytics/lib/format';

import { money } from '../fixtures';

describe('formatMoney', () => {
  it('shows the display string of the money object in Long mode', () => {
    expect(formatMoney(money(2034500), 'long')).toBe('$20345.00');
  });

  it('shows the short display string of the money object in Short mode', () => {
    expect(formatMoney(money(2034500), 'short')).toBe('$20.3K');
  });

  it('keeps the currency of the money object', () => {
    expect(formatMoney(money(9000, 'EUR', '€'), 'long')).toBe('€90.00');
  });

  it('shows a dash for an empty value, not zero', () => {
    expect(formatMoney(null, 'short')).toBe('—');
    expect(formatMoney(null, 'long')).toBe('—');
  });
});

describe('moneyValue', () => {
  it('gives the long amount as the title in Short mode when the short text is different', () => {
    expect(moneyValue(money(2034500), 'short')).toEqual({ text: '$20.3K', title: '$20345.00' });
  });

  it('gives no title when the short and long text are the same', () => {
    expect(moneyValue(money(8550), 'short')).toEqual({ text: '$85.50', title: undefined });
  });

  it('gives no title in Long mode or for an empty value', () => {
    expect(moneyValue(money(2034500), 'long')).toEqual({ text: '$20345.00', title: undefined });
    expect(moneyValue(null, 'short')).toEqual({ text: '—', title: undefined });
  });
});

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('shows zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('shows a dash for an empty value', () => {
    expect(formatNumber(null)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('keeps one decimal', () => {
    expect(formatPercent(33.333)).toBe('33.3%');
    expect(formatPercent(100)).toBe('100.0%');
  });

  it('shows a dash for an empty value', () => {
    expect(formatPercent(null)).toBe('—');
  });
});
