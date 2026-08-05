import { describe, expect, it } from 'vitest';

import { TaxRegionEuFormSchema } from '@/schemas/forms/tax-region-eu-form';

describe('TaxRegionEuFormSchema', () => {
  it('produces the exact payload', () => {
    const result = TaxRegionEuFormSchema.parse({
      type: 'micro_business',
      product_tax: [{ state: 'DE', rate: '19' }],
    });
    expect(result).toEqual({ type: 'micro_business', product_tax: [{ state: 'DE', rate: '19' }] });
  });

  it('defaults type to oss and product_tax to empty', () => {
    const result = TaxRegionEuFormSchema.parse({});
    expect(result.type).toBe('oss');
    expect(result.product_tax).toEqual([]);
  });
});
