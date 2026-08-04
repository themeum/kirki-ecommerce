import { describe, expect, it } from 'vitest';

import { TaxSettingsFormSchema } from '@/schemas/forms/tax-settings-form';

describe('TaxSettingsFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const regions = [{ code: 'US', name: 'United States', is_enabled: true }];
    const result = TaxSettingsFormSchema.parse({
      is_tax_inclusive_price: true,
      is_enabled_taxed_price: false,
      is_shipping_tax_enabled: true,
      tax_regions: regions,
      tax_services: [],
      tax_ids: [],
    });

    expect(result).toEqual({
      is_tax_inclusive_price: true,
      is_enabled_taxed_price: false,
      is_shipping_tax_enabled: true,
      tax_regions: regions,
      tax_services: [],
      tax_ids: [],
    });
  });

  it('defaults booleans to false and arrays to empty', () => {
    const result = TaxSettingsFormSchema.parse({});
    expect(result.is_tax_inclusive_price).toBe(false);
    expect(result.is_enabled_taxed_price).toBe(false);
    expect(result.is_shipping_tax_enabled).toBe(false);
    expect(result.tax_regions).toEqual([]);
    expect(result.tax_services).toEqual([]);
    expect(result.tax_ids).toEqual([]);
  });
});
