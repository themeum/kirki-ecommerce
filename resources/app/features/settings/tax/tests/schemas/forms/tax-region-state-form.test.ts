import { describe, expect, it } from 'vitest';

import { TaxRegionStateFormSchema } from '@/features/settings/tax/schemas/forms/tax-region-state-form';
import { getDefaults } from '@/libs/zod';

describe('TaxRegionStateFormSchema', () => {
  it('produces the exact payload, coercing both rates to numbers and passing rules through', () => {
    const rules = [
      {
        relation: 'AND',
        conditions: [{ type: 'tax_profile', operator: '=', value: 'digital' }],
        action: { type: 'set_tax_rate', value: 7 },
      },
    ];
    const result = TaxRegionStateFormSchema.parse({
      product_tax_rate: '20',
      shipping_tax_rate: 5,
      rules,
    });

    expect(result).toEqual({ product_tax_rate: 20, shipping_tax_rate: 5, rules });
  });

  it('seeds the form with zero for both rates and no rules', () => {
    expect(getDefaults(TaxRegionStateFormSchema)).toEqual({
      product_tax_rate: 0,
      shipping_tax_rate: 0,
      rules: [],
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
