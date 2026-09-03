import { describe, expect, it } from 'vitest';

import { TaxRegionStateFormSchema } from '@/features/settings/tax/schemas/forms/tax-region-state-form';
import { getDefaults } from '@/libs/zod';

describe('TaxRegionStateFormSchema', () => {
  it('produces the exact payload, coercing both rates to numbers', () => {
    const result = TaxRegionStateFormSchema.parse({
      product_tax_rate: '20',
      shipping_tax_rate: 5,
    });

    expect(result).toEqual({ product_tax_rate: 20, shipping_tax_rate: 5 });
  });

  it('seeds the form with zero for both rates', () => {
    expect(getDefaults(TaxRegionStateFormSchema)).toEqual({
      product_tax_rate: 0,
      shipping_tax_rate: 0,
    });
  });

  it('rejects a missing or blank rate', () => {
    expect(TaxRegionStateFormSchema.safeParse({}).success).toBe(false);
    expect(
      TaxRegionStateFormSchema.safeParse({ product_tax_rate: '', shipping_tax_rate: 5 }).success,
    ).toBe(false);
    expect(
      TaxRegionStateFormSchema.safeParse({ product_tax_rate: 20, shipping_tax_rate: '' }).success,
    ).toBe(false);
  });
});
