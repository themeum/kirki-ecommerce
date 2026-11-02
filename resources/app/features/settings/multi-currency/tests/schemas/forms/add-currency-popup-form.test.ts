import { describe, expect, it } from 'vitest';

import { AddCurrencyPopupFormSchema } from '@/features/settings/multi-currency/schemas/forms/add-currency-popup-form';

const euro = { name: 'Euro', code: 'EUR', symbol: '€', is_base: false, is_active: true };

describe('AddCurrencyPopupFormSchema', () => {
  it('produces the exact payload for selected currencies with a rate', () => {
    const result = AddCurrencyPopupFormSchema.parse({
      selectedCurrencies: [{ ...euro, exchange_rate: 0.85 }],
    });
    expect(result).toEqual({
      selectedCurrencies: [{ ...euro, exchange_rate: 0.85 }],
    });
  });

  it('rejects an empty selection', () => {
    expect(AddCurrencyPopupFormSchema.safeParse({ selectedCurrencies: [] }).success).toBe(false);
  });

  it('rejects a missing, empty or zero exchange rate', () => {
    [undefined, '', 0].forEach((exchange_rate) => {
      const result = AddCurrencyPopupFormSchema.safeParse({
        selectedCurrencies: [{ ...euro, exchange_rate }],
      });
      expect(result.success).toBe(false);
    });
  });
});
