import { describe, expect, it } from 'vitest';

import {
  CountryTaxRateSchema,
  StateTaxRateSchema,
  TaxProfileSchema,
  TaxRegionSchema,
  TaxRuleSchema,
} from '@/features/settings/tax/schemas/catalog/tax';

describe('TaxProfileSchema', () => {
  it('accepts the documented list item (tax-profiles/list-11.yml)', () => {
    const result = TaxProfileSchema.safeParse({
      id: 1,
      name: 'Heavy Weight',
      created_at: '2025-11-26 10:52:00',
      updated_at: '2025-11-26 10:52:00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts the optional fields being absent', () => {
    const result = TaxProfileSchema.safeParse({ id: 1, name: 'Heavy Weight' });
    expect(result.success).toBe(true);
  });
});

describe('StateTaxRateSchema', () => {
  it('accepts a state keyed by id with both rates and its own rules', () => {
    const result = StateTaxRateSchema.safeParse({
      id: '771',
      name: 'Dhaka District',
      product_tax_rate: 20,
      shipping_tax_rate: 5,
      rules: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a rate sent as a string', () => {
    const result = StateTaxRateSchema.safeParse({ id: '771', product_tax_rate: '20' });
    expect(result.success).toBe(true);
  });

  it('rejects a state with no id', () => {
    expect(StateTaxRateSchema.safeParse({ name: 'Dhaka District' }).success).toBe(false);
  });
});

describe('CountryTaxRateSchema', () => {
  it('accepts an EU member country keyed by code', () => {
    const result = CountryTaxRateSchema.safeParse({
      code: 'AT',
      name: 'Austria',
      flag: '🇦🇹',
      rate: 20,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a member country with no code', () => {
    expect(CountryTaxRateSchema.safeParse({ name: 'Austria' }).success).toBe(false);
  });
});

describe('TaxRuleSchema', () => {
  it('accepts a fully specified rule', () => {
    const result = TaxRuleSchema.safeParse({
      relation: 'AND',
      conditions: [{ type: 'tax_profile', operator: '=', value: 'laptop' }],
      action: { type: 'set_tax_rate', value: 3.5 },
    });
    expect(result.success).toBe(true);
  });

  it('parses a malformed rule leniently rather than throwing', () => {
    const result = TaxRuleSchema.safeParse({
      conditions: [{ unexpected: 'value' }],
      action: {},
      extra: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('TaxRegionSchema', () => {
  it('accepts a general per-state region keyed by state id', () => {
    const result = TaxRegionSchema.safeParse({
      code: 'BD',
      name: 'Bangladesh',
      flag: '🇧🇩',
      is_enabled: true,
      type: null,
      is_central_tax_enabled: false,
      rules: [],
      states: [
        {
          id: '771',
          name: 'Dhaka District',
          product_tax_rate: 20,
          shipping_tax_rate: 5,
          rules: [],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a general country-wide region with central rates', () => {
    const result = TaxRegionSchema.safeParse({
      code: 'BD',
      is_enabled: true,
      is_central_tax_enabled: true,
      central_product_tax: 15,
      central_shipping_tax: 5,
      states: [],
      rules: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts the EU region with per-country VAT rates', () => {
    const result = TaxRegionSchema.safeParse({
      code: 'EU',
      name: 'European Union',
      flag: '🇪🇺',
      is_enabled: true,
      type: 'oss',
      rules: [],
      countries: [{ code: 'AT', name: 'Austria', flag: '🇦🇹', rate: 20 }],
    });
    expect(result.success).toBe(true);
  });

  it('resolves an EU region to the EU member of the union, keeping its countries', () => {
    const result = TaxRegionSchema.parse({
      code: 'EU',
      countries: [{ code: 'AT', rate: 20 }],
    });
    expect(result).toMatchObject({ code: 'EU', countries: [{ code: 'AT' }] });
  });

  it('accepts an unrecognized extra field', () => {
    const result = TaxRegionSchema.safeParse({ code: 'BD', unexpected: 'value' });
    expect(result.success).toBe(true);
  });

  it('rejects a region with no code', () => {
    expect(TaxRegionSchema.safeParse({}).success).toBe(false);
  });
});
