import { describe, expect, it } from 'vitest';

import { TaxRegionGeneralFormSchema } from '@/schemas/forms/tax-region-general-form';

describe('TaxRegionGeneralFormSchema', () => {
  it('produces the exact payload', () => {
    const result = TaxRegionGeneralFormSchema.parse({
      product_tax: [{ state: 'CA', rate: '7.5' }],
      is_central_tax_enabled: true,
      central_product_tax: '5',
    });
    expect(result).toEqual({
      product_tax: [{ state: 'CA', rate: '7.5' }],
      is_central_tax_enabled: true,
      central_product_tax: '5',
    });
  });

  it('defaults to empty product_tax and disabled central tax', () => {
    const result = TaxRegionGeneralFormSchema.parse({});
    expect(result.product_tax).toEqual([]);
    expect(result.is_central_tax_enabled).toBe(false);
    expect(result.central_product_tax).toBe(0);
  });
});
