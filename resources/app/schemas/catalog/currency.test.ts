import { describe, expect, it } from 'vitest';

import {
  CurrencyDraftSchema,
  CurrencyExchangeProviderSchema,
  CurrencyOptionSchema,
  CurrencySchema,
} from '@/schemas/catalog/currency';

describe('CurrencySchema', () => {
  it('accepts the documented list item (currencies/list-1.yml)', () => {
    const result = CurrencySchema.safeParse({
      id: 1,
      name: 'USD',
      code: 'usd',
      symbol: '$',
      exchange_rate: 1,
      is_base: true,
      is_active: true,
      created_at: '2025-11-05 05:48:33',
      updated_at: '2025-11-05 05:48:33',
    });
    expect(result.success).toBe(true);
  });

  it('accepts the currency-settings fields not present on the plain list item (settings/currency.yml)', () => {
    const result = CurrencySchema.safeParse({
      id: 1,
      name: 'USD',
      code: 'usd',
      is_automatic_update_enabled: true,
      api_provider: 'currency_api',
      last_sync_at: '2026-02-26 11:28:22',
      next_sync_at: '2026-02-26 12:28:23',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an unrecognized extra field', () => {
    const result = CurrencySchema.safeParse({ id: 1, name: 'USD', code: 'usd', unexpected: 'value' });
    expect(result.success).toBe(true);
  });

  it('accepts every optional field absent', () => {
    const result = CurrencySchema.safeParse({ id: 1, name: 'USD', code: 'usd' });
    expect(result.success).toBe(true);
  });
});

describe('CurrencyOptionSchema', () => {
  it('accepts the documented world-currency entry (currencies/all-currency-list.yml)', () => {
    const result = CurrencyOptionSchema.safeParse({ name: 'US Dollar', code: 'USD', symbol: '$' });
    expect(result.success).toBe(true);
  });

  it('has no id, unlike the stored Currency resource', () => {
    const result = CurrencyOptionSchema.safeParse({ name: 'US Dollar', code: 'USD' });
    expect(result.success).toBe(true);
  });
});

describe('CurrencyDraftSchema', () => {
  it('accepts a newly selected currency with no id (add-currency flow)', () => {
    const result = CurrencyDraftSchema.safeParse({ name: 'US Dollar', code: 'USD', symbol: '$' });
    expect(result.success).toBe(true);
  });

  it('accepts an existing currency having one field toggled (available-currency-list.tsx)', () => {
    const result = CurrencyDraftSchema.safeParse({
      id: 2,
      name: 'BDT',
      code: 'bdt',
      symbol: '#',
      exchange_rate: 1,
      is_base: false,
      is_active: false,
    });
    expect(result.success).toBe(true);
  });
});

describe('CurrencyExchangeProviderSchema', () => {
  it('accepts the documented provider entry (currency-exchange/available-providers-list.yml)', () => {
    const result = CurrencyExchangeProviderSchema.safeParse({
      id: 'currency_api',
      name: 'CurrencyApi',
      icon: 'http://droip.local/.../currencyapi.png',
      description: 'CurrencyApi.com - Free & reliable currency data API',
    });
    expect(result.success).toBe(true);
  });

  it('accepts the optional fields being absent', () => {
    const result = CurrencyExchangeProviderSchema.safeParse({ id: 'currency_api', name: 'CurrencyApi' });
    expect(result.success).toBe(true);
  });
});
