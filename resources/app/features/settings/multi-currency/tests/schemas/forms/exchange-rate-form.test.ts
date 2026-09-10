import { describe, expect, it } from 'vitest';

import { ExchangeRateFormSchema } from '@/features/settings/multi-currency/schemas/forms/exchange-rate-form';

describe('ExchangeRateFormSchema', () => {
  it('produces the exact payload for the selected currency items', () => {
    const result = ExchangeRateFormSchema.parse({
      items: [{ name: 'Euro', code: 'EUR', symbol: '€', exchange_rate: '0.85', is_base: false, is_active: true }],
    });
    expect(result).toEqual({
      items: [{ name: 'Euro', code: 'EUR', symbol: '€', exchange_rate: '0.85', is_base: false, is_active: true }],
    });
  });

  it('keeps an explicitly inactive currency inactive', () => {
    const result = ExchangeRateFormSchema.parse({
      items: [{ name: 'Euro', code: 'EUR', symbol: '€', exchange_rate: '0.85', is_base: false, is_active: false }],
    });
    expect(result.items[0].is_active).toBe(false);
  });

  it('accepts an empty item list', () => {
    expect(ExchangeRateFormSchema.safeParse({ items: [] }).success).toBe(true);
  });

  it('rejects a non-positive exchange rate', () => {
    const zero = ExchangeRateFormSchema.safeParse({
      items: [{ name: 'Euro', code: 'EUR', symbol: '€', exchange_rate: '0', is_base: false, is_active: true }],
    });
    const blank = ExchangeRateFormSchema.safeParse({
      items: [{ name: 'Euro', code: 'EUR', symbol: '€', exchange_rate: '', is_base: false, is_active: true }],
    });
    const negative = ExchangeRateFormSchema.safeParse({
      items: [{ name: 'Euro', code: 'EUR', symbol: '€', exchange_rate: -1, is_base: false, is_active: true }],
    });

    expect(zero.success).toBe(false);
    expect(blank.success).toBe(false);
    expect(negative.success).toBe(false);
  });
});
