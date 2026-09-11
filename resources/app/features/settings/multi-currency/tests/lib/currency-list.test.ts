import { describe, expect, it } from 'vitest';

import type { CurrencyListItem } from '@/features/settings/multi-currency/lib/currency-list';
import {
  buildCurrencyListItems,
  buildCurrencyUpdatePayload,
} from '@/features/settings/multi-currency/lib/currency-list';
import type { CurrencyRateItem } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';

const buildCurrency = (overrides: Partial<CurrencyRateItem> = {}): CurrencyRateItem => ({
  id: 1,
  name: 'US Dollar',
  code: 'USD',
  symbol: '$',
  exchange_rate: 1,
  is_base: false,
  is_active: true,
  ...overrides,
});

describe('buildCurrencyListItems', () => {
  it('disables toggle/actions for the base currency and marks it enabled from is_active', () => {
    const [item] = buildCurrencyListItems([buildCurrency({ is_base: true, is_active: true })]);

    expect(item.is_toggle_disabled).toBe(true);
    expect(item.is_action_disabled).toBe(true);
    expect(item.is_enabled).toBe(true);
    expect(item.actionsArray).toEqual([]);
  });

  it('carries the symbol as the row icon and mirrors is_active to is_enabled', () => {
    const [item] = buildCurrencyListItems([buildCurrency({ is_active: false })]);

    expect(item.icon).toBe('$');
    expect(item.is_enabled).toBe(false);
  });
});

describe('buildCurrencyUpdatePayload', () => {
  const list: CurrencyListItem[] = [
    { ...buildCurrency({ id: 1, is_active: true, is_base: true }) },
    { ...buildCurrency({ id: 2, is_active: false, is_base: false }) },
  ];

  it('flips a single boolean field on the targeted currency, keeping only currency fields', () => {
    const payload = buildCurrencyUpdatePayload(list, list[1], 'is_active');

    expect(payload).toEqual({
      items: [
        {
          id: 2,
          name: 'US Dollar',
          code: 'USD',
          symbol: '$',
          exchange_rate: 1,
          is_active: true,
          is_base: false,
        },
      ],
    });
  });

  it('reassigns is_base across the whole list, unsetting the previous base', () => {
    const payload = buildCurrencyUpdatePayload(list, list[1], 'is_base');

    expect(payload).toEqual({
      items: [
        {
          id: 1,
          name: 'US Dollar',
          code: 'USD',
          symbol: '$',
          exchange_rate: 1,
          is_base: false,
          is_active: true,
        },
        {
          id: 2,
          name: 'US Dollar',
          code: 'USD',
          symbol: '$',
          exchange_rate: 1,
          is_base: true,
          is_active: false,
        },
      ],
    });
  });

  it('returns null when the targeted currency is not in the list', () => {
    const missing: CurrencyListItem = { ...buildCurrency({ id: 999 }) };

    expect(buildCurrencyUpdatePayload(list, missing, 'is_active')).toBeNull();
  });
});
