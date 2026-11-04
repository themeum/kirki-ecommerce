import { describe, expect, it } from 'vitest';

import {
  filterUnaddedCurrencies,
  resolveSearchInputValue,
  selectBaseCurrency,
  toggleCurrencySelection,
} from '@/features/settings/multi-currency/lib/currency-selection';
import type { CurrencyDraft, CurrencyOption } from '@/features/settings/multi-currency/schemas/catalog/currency';

const usd: CurrencyOption = { name: 'US Dollar', code: 'USD', symbol: '$' };
const eur: CurrencyOption = { name: 'Euro', code: 'EUR', symbol: '€' };

describe('filterUnaddedCurrencies', () => {
  it('excludes currencies already present in the store, case-insensitively', () => {
    const result = filterUnaddedCurrencies([usd, eur], [{ code: 'usd' }]);

    expect(result).toEqual([eur]);
  });

  it('returns every currency when none are added yet', () => {
    expect(filterUnaddedCurrencies([usd, eur], [])).toEqual([usd, eur]);
  });
});

describe('toggleCurrencySelection', () => {
  it('adds a currency as inactive and non-base', () => {
    const result = toggleCurrencySelection([], usd);

    expect(result).toEqual([{ ...usd, is_base: false, is_active: true }]);
  });

  it('removes a currency that is already selected', () => {
    const selected: CurrencyDraft[] = [{ ...usd, is_base: false, is_active: true }];

    expect(toggleCurrencySelection(selected, usd)).toEqual([]);
  });

  it('matches by name, leaving other selections untouched', () => {
    const selected: CurrencyDraft[] = [{ ...usd, is_base: false, is_active: true }];

    const result = toggleCurrencySelection(selected, eur);

    expect(result).toEqual([
      { ...usd, is_base: false, is_active: true },
      { ...eur, is_base: false, is_active: true },
    ]);
  });
});

describe('selectBaseCurrency', () => {
  it('selects a currency as the active base with rate 1', () => {
    const result = selectBaseCurrency([], usd);

    expect(result).toEqual([{ ...usd, is_base: true, is_active: true, exchange_rate: 1 }]);
  });

  it('replaces a previous pick instead of adding to it', () => {
    const selected: CurrencyDraft[] = [
      { ...usd, is_base: true, is_active: true, exchange_rate: 1 },
    ];

    const result = selectBaseCurrency(selected, eur);

    expect(result).toEqual([{ ...eur, is_base: true, is_active: true, exchange_rate: 1 }]);
  });

  it('clears the selection when the picked currency is selected again', () => {
    const selected: CurrencyDraft[] = [
      { ...usd, is_base: true, is_active: true, exchange_rate: 1 },
    ];

    expect(selectBaseCurrency(selected, usd)).toEqual([]);
  });
});

describe('resolveSearchInputValue', () => {
  it('reads the value off a change event', () => {
    expect(resolveSearchInputValue({ target: { value: 'euro' } })).toBe('euro');
  });

  it('passes a raw string through', () => {
    expect(resolveSearchInputValue('euro')).toBe('euro');
  });

  it('resolves a missing value to an empty string', () => {
    expect(resolveSearchInputValue(undefined)).toBe('');
  });
});
