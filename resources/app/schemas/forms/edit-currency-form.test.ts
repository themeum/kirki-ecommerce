import { describe, expect, it } from 'vitest';

import { EditCurrencyFormSchema } from '@/schemas/forms/edit-currency-form';

describe('EditCurrencyFormSchema', () => {
  it('produces the exact payload for a numeric-string exchange rate', () => {
    const result = EditCurrencyFormSchema.parse({ exchange_rate: '0.85' });
    expect(result).toEqual({ exchange_rate: '0.85' });
  });

  it('rejects a blank exchange rate', () => {
    expect(EditCurrencyFormSchema.safeParse({ exchange_rate: '' }).success).toBe(false);
  });
});
