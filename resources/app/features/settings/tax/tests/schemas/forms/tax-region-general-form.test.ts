import { describe, expect, it } from 'vitest';

import { TaxRegionGeneralFormSchema } from '@/features/settings/tax/schemas/forms/tax-region-general-form';

const state = {
  id: '771',
  name: 'Dhaka District',
  product_tax_rate: 20,
  shipping_tax_rate: 5,
  rules: [],
};

const countryWideRule = {
  relation: 'AND',
  conditions: [{ type: 'destination_region', operator: '=', value: ['771'] }],
  action: { type: 'set_tax_rate', value: 12 },
};

describe('TaxRegionGeneralFormSchema', () => {
  it('clears the states in country-wide mode and coerces central rates to numbers', () => {
    const result = TaxRegionGeneralFormSchema.parse({
      is_central_tax_enabled: true,
      central_product_tax: '5',
      central_shipping_tax: 3,
      states: [state],
      rules: [countryWideRule],
    });

    expect(result).toEqual({
      is_central_tax_enabled: true,
      central_product_tax: 5,
      central_shipping_tax: 3,
      states: [],
      rules: [countryWideRule],
    });
  });

  it('passes the states through in per-state mode, rules and all', () => {
    const second = {
      id: '785',
      name: 'Chittagong District',
      product_tax_rate: '7.5',
      shipping_tax_rate: '2',
      rules: [
        {
          relation: 'AND',
          conditions: [{ type: 'tax_profile', operator: '=', value: 'digital' }],
          action: { type: 'set_tax_rate', value: 7 },
        },
      ],
    };

    const result = TaxRegionGeneralFormSchema.parse({
      is_central_tax_enabled: false,
      states: [state, second],
    });

    expect(result).toEqual({
      is_central_tax_enabled: false,
      central_product_tax: null,
      central_shipping_tax: null,
      states: [state, second],
      rules: [],
    });
  });

  it('defaults to country-wide mode with zero central rates and no states', () => {
    const result = TaxRegionGeneralFormSchema.parse({});

    expect(result).toEqual({
      is_central_tax_enabled: true,
      central_product_tax: null,
      central_shipping_tax: null,
      states: [],
      rules: [],
    });
  });

  it('treats blank central rates as zero when country-wide mode is on', () => {
    const result = TaxRegionGeneralFormSchema.parse({
      is_central_tax_enabled: true,
      central_product_tax: '',
      central_shipping_tax: '',
    });
    expect(result).toEqual({
      is_central_tax_enabled: true,
      central_product_tax: null,
      central_shipping_tax: null,
      states: [],
      rules: [],
    });
  });

  it('requires at least one state when per-state mode is on', () => {
    const result = TaxRegionGeneralFormSchema.safeParse({
      is_central_tax_enabled: false,
      states: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a state with no id', () => {
    const result = TaxRegionGeneralFormSchema.safeParse({
      is_central_tax_enabled: false,
      states: [{ name: 'Dhaka District', product_tax_rate: 20, shipping_tax_rate: 5 }],
    });
    expect(result.success).toBe(false);
  });
});
