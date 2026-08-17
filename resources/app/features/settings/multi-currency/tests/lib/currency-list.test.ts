import { describe, expect, it } from 'vitest';

import type { CurrencyListItem } from '@/features/settings/multi-currency/lib/currency-list';
import { buildCurrencyListItems, buildCurrencyUpdatePayload, getActionArray } from '@/features/settings/multi-currency/lib/currency-list';
import type { Currency } from '@/features/settings/multi-currency/schemas/catalog/currency';

const buildCurrency = (overrides: Partial<Currency>): Currency => ({
  id: 1,
  name: 'US Dollar',
  code: 'USD',
  symbol: '$',
  ...overrides,
});

describe('getActionArray', () => {
  it('offers no actions for the base currency', () => {
    expect(getActionArray(buildCurrency({ is_base: true }))).toEqual([]);
  });

  it('offers edit, delete, and set-base actions for a non-base currency', () => {
    const actions = getActionArray(buildCurrency({ is_base: false }));

    expect(actions.map((a) => a.value)).toEqual(['edit', 'delete', 'set_base']);
  });
});

describe('buildCurrencyListItems', () => {
  it('disables toggle/actions for the base currency and marks it enabled from is_active', () => {
    const [item] = buildCurrencyListItems([buildCurrency({ is_base: true, is_active: true })]);

    expect(item.is_toggle_disabled).toBe(true);
    expect(item.is_action_disabled).toBe(true);
    expect(item.is_enabled).toBe(true);
    expect(item.actionsArray).toEqual([]);
  });

  it('formats the exchange rate as a string and leaves it undefined when absent', () => {
    const [withRate] = buildCurrencyListItems([buildCurrency({ exchange_rate: 1.25 })]);
    const [withoutRate] = buildCurrencyListItems([buildCurrency({ exchange_rate: null })]);

    expect(withRate.rightText).toBe('1.25');
    expect(withoutRate.rightText).toBeUndefined();
  });
});

describe('buildCurrencyUpdatePayload', () => {
  const list: CurrencyListItem[] = [
    { ...buildCurrency({ id: 1, is_active: true, is_base: true }) },
    { ...buildCurrency({ id: 2, is_active: false, is_base: false }) },
  ];

  it('flips a single boolean field on the targeted currency', () => {
    const payload = buildCurrencyUpdatePayload(list, list[1], 'is_active');

    expect(payload).toEqual({
      items: [{ ...list[1], is_active: true, is_base: false }],
    });
  });

  it('reassigns is_base across the whole list, unsetting the previous base', () => {
    const payload = buildCurrencyUpdatePayload(list, list[1], 'is_base');

    expect(payload).toEqual({
      items: [
        { ...list[0], is_base: false, is_active: true },
        { ...list[1], is_base: true, is_active: false },
      ],
    });
  });

  it('returns null when the targeted currency is not in the list', () => {
    const missing: CurrencyListItem = { ...buildCurrency({ id: 999 }) };

    expect(buildCurrencyUpdatePayload(list, missing, 'is_active')).toBeNull();
  });
});
