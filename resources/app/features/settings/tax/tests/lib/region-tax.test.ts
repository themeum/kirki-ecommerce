import { describe, expect, it } from 'vitest';

import {
  applyEuRegionUpdate,
  applyRegionRules,
  applyRegionTaxUpdate,
  deriveEuRegion,
  mergeCitiesIntoTaxRates,
  resolveVatProcessChange,
} from '@/features/settings/tax/lib/region-tax';
import type { TaxRegion, TaxRegionState } from '@/features/settings/tax/lib/utils';

const buildRegion = (overrides: Partial<TaxRegion>): TaxRegion => ({
  code: 'US',
  name: 'United States',
  is_enabled: true,
  states: [],
  ...overrides,
});

describe('mergeCitiesIntoTaxRates', () => {
  it('adds a zero-rate entry for each newly picked city', () => {
    const cities: TaxRegionState[] = [{ id: 1, title: 'Austin' }, { id: 2, title: 'Dallas' }];

    expect(mergeCitiesIntoTaxRates([], cities)).toEqual([
      { state: 'Austin', rate: 0 },
      { state: 'Dallas', rate: 0 },
    ]);
  });

  it('skips a city that already has a rate', () => {
    const existing = [{ state: 'Austin', rate: 5 }];
    const cities: TaxRegionState[] = [{ id: 1, title: 'Austin' }, { id: 2, title: 'Dallas' }];

    expect(mergeCitiesIntoTaxRates(existing, cities)).toEqual([
      { state: 'Austin', rate: 5 },
      { state: 'Dallas', rate: 0 },
    ]);
  });
});

describe('applyRegionTaxUpdate', () => {
  it('updates only the matching region\'s tax fields', () => {
    const regions = [buildRegion({ code: 'US' }), buildRegion({ code: 'CA' })];

    const result = applyRegionTaxUpdate(regions, 'US', {
      product_tax: [{ state: 'TX', rate: 6 }],
      is_central_tax_enabled: true,
      central_product_tax: 5,
    });

    expect(result[0]).toMatchObject({
      code: 'US',
      product_tax: [{ state: 'TX', rate: 6 }],
      is_central_tax_enabled: true,
      central_product_tax: 5,
    });
    expect(result[1]).toEqual(regions[1]);
  });

  it('prefers explicitly passed updated rates over the form values', () => {
    const regions = [buildRegion({ code: 'US' })];

    const result = applyRegionTaxUpdate(
      regions,
      'US',
      { product_tax: [{ state: 'TX', rate: 6 }], is_central_tax_enabled: false, central_product_tax: 0 },
      [{ state: 'CA', rate: 8 }],
    );

    expect(result[0].product_tax).toEqual([{ state: 'CA', rate: 8 }]);
  });
});

describe('applyRegionRules', () => {
  it('replaces only the matching region\'s rules', () => {
    const regions = [buildRegion({ code: 'US' }), buildRegion({ code: 'EU' })];
    const rules = [{ conditions: [], action: { type: 'set_tax_profile', value: 1 } }];

    const result = applyRegionRules(regions, 'EU', rules);

    expect(result[0]).toEqual(regions[0]);
    expect(result[1].rules).toEqual(rules);
  });
});

describe('applyEuRegionUpdate', () => {
  it('writes the VAT type and rate list onto the EU region only', () => {
    const regions = [buildRegion({ code: 'US' }), buildRegion({ code: 'EU' })];

    const result = applyEuRegionUpdate(regions, { type: 'oss', product_tax: [{ country: 'DE', rate: 19 }] });

    expect(result[0]).toEqual(regions[0]);
    expect(result[1]).toMatchObject({ type: 'oss', product_tax: [{ country: 'DE', rate: 19 }] });
  });

  it('applies extra overrides on top of the form values', () => {
    const regions = [buildRegion({ code: 'EU' })];

    const result = applyEuRegionUpdate(
      regions,
      { type: 'oss', product_tax: [] },
      { product_tax: [{ country: 'FR', rate: 20 }] },
    );

    expect(result[0].product_tax).toEqual([{ country: 'FR', rate: 20 }]);
  });
});

describe('deriveEuRegion', () => {
  it('overlays the form\'s process and rate list onto the stored EU region', () => {
    const regions = [buildRegion({ code: 'EU', type: 'oss', product_tax: [{ country: 'DE', rate: 19 }] })];

    const result = deriveEuRegion(regions, 'micro_business', [{ country: 'FR', rate: 20 }]);

    expect(result).toMatchObject({ code: 'EU', type: 'micro_business', product_tax: [{ country: 'FR', rate: 20 }] });
  });

  it('returns undefined when there is no EU region yet', () => {
    expect(deriveEuRegion([buildRegion({ code: 'US' })], 'oss', [])).toBeUndefined();
  });
});

describe('resolveVatProcessChange', () => {
  it('collapses the rate list to its first entry when switching to micro_business', () => {
    const list = [{ country: 'DE', rate: 19 }, { country: 'FR', rate: 20 }];

    expect(resolveVatProcessChange('micro_business', list)).toEqual([{ country: 'DE', rate: 19 }]);
  });

  it('leaves the rate list untouched for any other process', () => {
    const list = [{ country: 'DE', rate: 19 }];

    expect(resolveVatProcessChange('oss', list)).toBeUndefined();
  });

  it('does nothing when the list is already empty', () => {
    expect(resolveVatProcessChange('micro_business', [])).toBeUndefined();
  });
});
