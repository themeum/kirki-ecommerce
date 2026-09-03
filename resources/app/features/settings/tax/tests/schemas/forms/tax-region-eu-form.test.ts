import { describe, expect, it } from 'vitest';

import { TaxRegionEuFormSchema } from '@/features/settings/tax/schemas/forms/tax-region-eu-form';

describe('TaxRegionEuFormSchema', () => {
  it('produces the exact payload', () => {
    const countries = [
      { code: 'DE', name: 'Germany', flag: '🇩🇪', product_tax_rate: 19, shipping_tax_rate: 19 },
    ];
    const result = TaxRegionEuFormSchema.parse({ type: 'micro_business', countries });

    expect(result).toEqual({ type: 'micro_business', countries });
  });

  it('defaults type to oss and countries to empty', () => {
    expect(TaxRegionEuFormSchema.parse({})).toEqual({ type: 'oss', countries: [] });
  });

  it('rejects an unrecognized process (the page normalizes on hydration)', () => {
    expect(TaxRegionEuFormSchema.safeParse({ type: 'something-else' }).success).toBe(false);
  });

  it('rejects a member country with no code', () => {
    const result = TaxRegionEuFormSchema.safeParse({
      type: 'oss',
      countries: [{ name: 'Germany', product_tax_rate: 19 }],
    });
    expect(result.success).toBe(false);
  });
});
