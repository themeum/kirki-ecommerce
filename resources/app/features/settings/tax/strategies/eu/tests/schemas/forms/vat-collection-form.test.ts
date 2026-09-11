import { describe, expect, it } from 'vitest';

import { VatCollectionFormSchema } from '@/features/settings/tax/strategies/eu/schemas/forms/vat-collection-form';

describe('VatCollectionFormSchema', () => {
  it('produces the exact payload, coercing the rate to a number', () => {
    const result = VatCollectionFormSchema.parse({
      code: 'DE',
      name: 'Germany',
      flag: '🇩🇪',
      rate: '19',
    });

    expect(result).toEqual({
      code: 'DE',
      name: 'Germany',
      flag: '🇩🇪',
      rate: 19,
    });
  });

  it('sends undefined (not null) for a blank name or flag, matching CountryTaxRate', () => {
    const result = VatCollectionFormSchema.parse({
      code: 'DE',
      name: '',
      flag: '',
      rate: 19,
    });

    expect(result.name).toBeUndefined();
    expect(result.flag).toBeUndefined();
    expect('flag' in result).toBe(true);
  });

  it('rejects a blank country or a blank rate', () => {
    expect(
      VatCollectionFormSchema.safeParse({ code: '  ', rate: 19 }).success,
    ).toBe(false);
    expect(
      VatCollectionFormSchema.safeParse({ code: 'DE', rate: '' }).success,
    ).toBe(false);
  });
});
