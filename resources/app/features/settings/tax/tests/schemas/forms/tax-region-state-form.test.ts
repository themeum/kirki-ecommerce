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

  it('seeds the form with empty rates and no rules', () => {
    expect(getDefaults(TaxRegionStateFormSchema)).toEqual({
      product_tax_rate: undefined,
      shipping_tax_rate: undefined,
      rules: [],
    });
  });

  it('treats a missing or blank rate as zero', () => {
    expect(TaxRegionStateFormSchema.parse({})).toEqual({
      product_tax_rate: null,
      shipping_tax_rate: null,
      rules: [],
    });
    expect(TaxRegionStateFormSchema.parse({ product_tax_rate: '', shipping_tax_rate: 5 })).toEqual({
      product_tax_rate: null,
      shipping_tax_rate: 5,
      rules: [],
    });
  });
});
