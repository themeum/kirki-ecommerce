import { describe, expect, it } from 'vitest';

import { MultiCurrencySettingsFormSchema } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';

describe('MultiCurrencySettingsFormSchema', () => {
  const baseCurrency = {
    id: 1,
    name: 'US Dollar',
    code: 'USD',
    symbol: '$',
    exchange_rate: 1,
    is_base: true,
    is_active: true,
  };

  const secondCurrency = {
    id: 2,
    name: 'Euro',
    code: 'EUR',
    symbol: '€',
    exchange_rate: 0.92,
    is_base: false,
    is_active: true,
  };

  const base = {
    currencies: [baseCurrency, secondCurrency],
    is_automatic_update_enabled: false,
    api_provider: '',
    api_configs: {},
    currency_format: 'short',
    currency_position: 'before',
    thousand_separator: ',',
    decimal_separator: '.',
    last_sync_at: null,
    next_sync_at: null,
  };

  it('sends is_automatic_update_enabled when a provider and API key are set', () => {
    const result = MultiCurrencySettingsFormSchema.parse({
      ...base,
      is_automatic_update_enabled: true,
      api_provider: 'exchangerate-api',
      api_configs: {
        'exchangerate-api': { api_key: 'secret-key', update_frequency: 'every_1_hour' },
      },
    });
    expect(result.is_automatic_update_enabled).toBe(true);
    expect(result.api_configs['exchangerate-api']?.api_key).toBe('secret-key');
  });

  it('sends is_automatic_update_enabled as set without a provider or API key', () => {
    const withoutProvider = MultiCurrencySettingsFormSchema.parse({
      ...base,
      is_automatic_update_enabled: true,
      api_provider: 'exchangerate-api',
    });
    const withoutKey = MultiCurrencySettingsFormSchema.parse({
      ...base,
      is_automatic_update_enabled: true,
      api_provider: 'exchangerate-api',
    });
    expect(withoutProvider.is_automatic_update_enabled).toBe(true);
    expect(withoutKey.is_automatic_update_enabled).toBe(true);
  });

  it('does not send the server-owned sync state', () => {
    const result = MultiCurrencySettingsFormSchema.parse({
      ...base,
      last_sync_at: '2026-10-14 10:00:00',
      next_sync_at: '2026-10-14 11:00:00',
      last_sync_error: 'Invalid API key.',
      last_sync_error_at: '2026-10-14 10:00:00',
    });
    expect(result).not.toHaveProperty('last_sync_at');
    expect(result).not.toHaveProperty('next_sync_at');
    expect(result).not.toHaveProperty('last_sync_error');
    expect(result).not.toHaveProperty('last_sync_error_at');
  });

  it('sends null for blank api_provider and format fields', () => {
    const result = MultiCurrencySettingsFormSchema.parse(base);
    expect(result.api_provider).toBeNull();
    expect(result.api_configs).toEqual({});
  });

  it('sends the configuration of every provider without a fallback behaviour', () => {
    const result = MultiCurrencySettingsFormSchema.parse({
      ...base,
      api_provider: 'currency_api',
      api_configs: {
        exchange_rates_api: { api_key: 'key-a', update_frequency: 'every_6_hours' },
        currency_api: { api_key: '', update_frequency: 'every_1_hour' },
      },
    });
    expect(result.api_configs).toEqual({
      exchange_rates_api: { api_key: 'key-a', update_frequency: 'every_6_hours' },
      currency_api: { api_key: null, update_frequency: 'every_1_hour' },
    });
  });

  it('defaults is_automatic_update_enabled to false', () => {
    const result = MultiCurrencySettingsFormSchema.parse({});
    expect(result.is_automatic_update_enabled).toBe(false);
  });

  it('sends is_automatic_update_enabled as false when only one currency exists', () => {
    const result = MultiCurrencySettingsFormSchema.parse({
      ...base,
      currencies: [baseCurrency],
      is_automatic_update_enabled: true,
    });
    expect(result.is_automatic_update_enabled).toBe(false);
  });

  const currencyItem = secondCurrency;

  it('accepts a currencies array with positive exchange rates', () => {
    expect(() =>
      MultiCurrencySettingsFormSchema.parse({ ...base, currencies: [currencyItem] }),
    ).not.toThrow();
  });

  it('rejects a zero, blank, or negative exchange rate', () => {
    for (const exchange_rate of [0, '', -1]) {
      expect(() =>
        MultiCurrencySettingsFormSchema.parse({
          ...base,
          currencies: [{ ...currencyItem, exchange_rate }],
        }),
      ).toThrow();
    }
  });

  it('does not forward currencies into the settings payload', () => {
    const result = MultiCurrencySettingsFormSchema.parse({
      ...base,
      currencies: [currencyItem],
    });
    expect(result).not.toHaveProperty('currencies');
  });
});
