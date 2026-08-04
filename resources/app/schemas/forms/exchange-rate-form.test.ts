import { describe, expect, it } from 'vitest';

import { ExchangeRateFormSchema } from '@/schemas/forms/exchange-rate-form';

describe('ExchangeRateFormSchema', () => {
  it('produces the exact payload for the selected currency items', () => {
    const result = ExchangeRateFormSchema.parse({
      items: [{ name: 'Euro', code: 'EUR', symbol: '€', exchange_rate: '0.85' }],
    });
    expect(result).toEqual({
      items: [{ name: 'Euro', code: 'EUR', symbol: '€', exchange_rate: '0.85' }],
    });
  });

  it('accepts an empty item list', () => {
    expect(ExchangeRateFormSchema.safeParse({ items: [] }).success).toBe(true);
  });
});
