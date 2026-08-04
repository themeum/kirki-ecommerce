import { describe, expect, it } from 'vitest';

import { AddCurrencyPopupFormSchema } from '@/schemas/forms/add-currency-popup-form';

describe('AddCurrencyPopupFormSchema', () => {
  it('produces the exact payload for selected currencies', () => {
    const result = AddCurrencyPopupFormSchema.parse({
      selectedCurrencies: [{ name: 'Euro', code: 'EUR', symbol: '€' }],
    });
    expect(result).toEqual({
      selectedCurrencies: [{ name: 'Euro', code: 'EUR', symbol: '€' }],
    });
  });

  it('rejects an empty selection', () => {
    expect(AddCurrencyPopupFormSchema.safeParse({ selectedCurrencies: [] }).success).toBe(false);
  });
});
