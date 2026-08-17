import { describe, expect, it } from 'vitest';

import { TaxProfileSchema, TaxRateSchema, TaxRegionSchema } from '@/features/settings/tax/schemas/catalog/tax';

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

describe('TaxRateSchema', () => {
  it('accepts the documented rate entry (settings/tax.yml)', () => {
    const result = TaxRateSchema.safeParse({ state: 'AT', rate: 20 });
    expect(result.success).toBe(true);
  });

  it('accepts an unrecognized extra field', () => {
    const result = TaxRateSchema.safeParse({ state: 'AT', rate: 20, unexpected: 'value' });
    expect(result.success).toBe(true);
  });

  it('accepts the optional flag being absent', () => {
    const result = TaxRateSchema.safeParse({ state: 'AT', rate: '20' });
    expect(result.success).toBe(true);
  });

  it('accepts an EU/OSS region rate entry keyed by country instead of state (confirmed live, GET /settings/tax)', () => {
    const result = TaxRateSchema.safeParse({ country: 'AT', rate: 20 });
    expect(result.success).toBe(true);
  });
});

describe('TaxRegionSchema', () => {
  const documentedRegion = {
    code: 'EU',
    name: 'European Union',
    type: 'oss',
    product_tax: [
      { state: 'AT', rate: 20 },
      { state: 'BE', rate: 21 },
    ],
    shipping_tax: [
      { state: 'AT', rate: 20 },
      { state: 'BE', rate: 21 },
    ],
    rules: [
      {
        relation: 'AND',
        conditions: [{ type: 'tax_profile', operator: '=', value: 'laptop' }],
        action: { type: 'set_tax_rate', value: 3.5 },
      },
    ],
  };

  it('accepts the documented region (settings/tax.yml)', () => {
    const result = TaxRegionSchema.safeParse(documentedRegion);
    expect(result.success).toBe(true);
  });

  it('accepts an unrecognized extra field', () => {
    const result = TaxRegionSchema.safeParse({ ...documentedRegion, unexpected: 'value' });
    expect(result.success).toBe(true);
  });

  it('accepts a region with every optional field absent', () => {
    const result = TaxRegionSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
