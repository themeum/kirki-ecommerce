import { describe, expect, it } from 'vitest';

import {
  addStatesToRegion,
  applyEuRegionUpdate,
  applyRegionRules,
  applyRegionTaxUpdate,
  deriveEuRegion,
  resolveVatProcessChange,
  updateRegionState,
} from '@/features/settings/tax/lib/region-tax';
import type {
  CountryTaxRate,
  GeneralTaxRegion,
  StateTaxRate,
  TaxRegion,
  TaxRegionState,
} from '@/features/settings/tax/lib/utils';

const buildRegion = (overrides: Partial<TaxRegion> & { code: string }): TaxRegion =>
  ({ is_enabled: true, ...overrides }) as TaxRegion;

const statesOf = (region: TaxRegion): StateTaxRate[] =>
  (region as GeneralTaxRegion).states ?? [];

const countriesOf = (region: TaxRegion): CountryTaxRate[] =>
  (region as { countries?: CountryTaxRate[] }).countries ?? [];

describe('addStatesToRegion', () => {
  it('appends a zero-rate entry for each newly picked state, keyed by id', () => {
    const picked: TaxRegionState[] = [
      { id: 771, name: 'Dhaka District' },
      { id: 785, name: 'Chittagong District' },
    ];

    expect(addStatesToRegion([], picked)).toEqual([
      { id: '771', name: 'Dhaka District', product_tax_rate: 0, shipping_tax_rate: 0, rules: [] },
      {
        id: '785',
        name: 'Chittagong District',
        product_tax_rate: 0,
        shipping_tax_rate: 0,
        rules: [],
      },
    ]);
  });

  it('skips a state id that already has an entry, keeping its rates and rules', () => {
    const existing: StateTaxRate[] = [
      { id: '771', name: 'Dhaka District', product_tax_rate: 5, shipping_tax_rate: 2, rules: [] },
    ];
    const picked: TaxRegionState[] = [
      { id: 771, name: 'Dhaka District' },
      { id: 785, name: 'Chittagong District' },
    ];

    const result = addStatesToRegion(existing, picked);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(existing[0]);
    expect(result[1]).toMatchObject({ id: '785', product_tax_rate: 0 });
  });

  it('falls back to the picker\'s title when it carries no name', () => {
    expect(addStatesToRegion([], [{ id: 771, title: 'Dhaka District' }])[0].name).toBe(
      'Dhaka District',
    );
  });
});

describe('applyRegionTaxUpdate', () => {
  const state: StateTaxRate = {
    id: '771',
    name: 'Dhaka District',
    product_tax_rate: 6,
    shipping_tax_rate: 2,
    rules: [],
  };

  it('updates only the matching region\'s tax fields', () => {
    const regions = [buildRegion({ code: 'US' }), buildRegion({ code: 'CA' })];

    const result = applyRegionTaxUpdate(regions, 'US', {
      is_central_tax_enabled: false,
      central_product_tax: 0,
      central_shipping_tax: 0,
      states: [state],
    });

    expect(result[0]).toMatchObject({
      code: 'US',
      is_central_tax_enabled: false,
      states: [state],
    });
    expect(result[1]).toEqual(regions[1]);
  });

  it('clears the states in country-wide mode', () => {
    const regions = [buildRegion({ code: 'US', states: [state] })];

    const result = applyRegionTaxUpdate(regions, 'US', {
      is_central_tax_enabled: true,
      central_product_tax: 15,
      central_shipping_tax: 5,
      states: [],
    });

    expect(result[0]).toMatchObject({
      states: [],
      central_product_tax: 15,
      central_shipping_tax: 5,
    });
  });

  it('preserves the region\'s display fields and its country-wide rules', () => {
    const rules = [{ relation: 'AND', conditions: [], action: { type: 'exempt', value: null } }];
    const regions = [buildRegion({ code: 'BD', name: 'Bangladesh', flag: '🇧🇩', rules })];

    const result = applyRegionTaxUpdate(regions, 'BD', {
      is_central_tax_enabled: true,
      central_product_tax: 15,
      central_shipping_tax: 5,
      states: [],
    });

    expect(result[0]).toMatchObject({ name: 'Bangladesh', flag: '🇧🇩', rules });
  });
});

describe('updateRegionState', () => {
  const regions = [
    buildRegion({
      code: 'BD',
      states: [
        { id: '771', name: 'Dhaka District', product_tax_rate: 20, shipping_tax_rate: 5, rules: [] },
        {
          id: '785',
          name: 'Chittagong District',
          product_tax_rate: 21,
          shipping_tax_rate: 6,
          rules: [],
        },
      ],
    }),
    buildRegion({ code: 'US' }),
  ];

  it('patches only the addressed state of the addressed region', () => {
    const result = updateRegionState(regions, 'BD', '785', {
      product_tax_rate: 9,
      shipping_tax_rate: 3,
    });

    expect(statesOf(result[0])[0]).toEqual(statesOf(regions[0])[0]);
    expect(statesOf(result[0])[1]).toMatchObject({
      id: '785',
      name: 'Chittagong District',
      product_tax_rate: 9,
      shipping_tax_rate: 3,
    });
    expect(result[1]).toEqual(regions[1]);
  });

  it('matches a numeric state id against the stored string id', () => {
    const result = updateRegionState(regions, 'BD', String(771), { product_tax_rate: 1 });

    expect(statesOf(result[0])[0].product_tax_rate).toBe(1);
  });

  it('leaves the region untouched when the state id is unknown', () => {
    expect(updateRegionState(regions, 'BD', '999', { product_tax_rate: 1 })[0]).toEqual(regions[0]);
  });
});

describe('applyRegionRules', () => {
  it('replaces only the matching region\'s rules', () => {
    const regions = [buildRegion({ code: 'US' }), buildRegion({ code: 'EU' })];
    const rules = [{ conditions: [], action: { type: 'set_tax_rate', value: 1 } }];

    const result = applyRegionRules(regions, 'EU', rules);

    expect(result[0]).toEqual(regions[0]);
    expect(result[1].rules).toEqual(rules);
  });
});

describe('applyEuRegionUpdate', () => {
  it('writes the VAT type and country list onto the EU region only', () => {
    const regions = [buildRegion({ code: 'US' }), buildRegion({ code: 'EU' })];
    const countries = [{ code: 'DE', name: 'Germany', product_tax_rate: 19, shipping_tax_rate: 19 }];

    const result = applyEuRegionUpdate(regions, { type: 'oss', countries });

    expect(result[0]).toEqual(regions[0]);
    expect(result[1]).toMatchObject({ type: 'oss', countries });
  });

  it('applies extra overrides on top of the form values', () => {
    const regions = [buildRegion({ code: 'EU' })];
    const override = [{ code: 'FR', product_tax_rate: 20, shipping_tax_rate: 20 }];

    const result = applyEuRegionUpdate(regions, { type: 'oss', countries: [] }, {
      countries: override,
    });

    expect(countriesOf(result[0])).toEqual(override);
  });
});

describe('deriveEuRegion', () => {
  it('overlays the form\'s process and country list onto the stored EU region', () => {
    const regions = [
      buildRegion({ code: 'EU', type: 'oss', countries: [{ code: 'DE', product_tax_rate: 19 }] }),
    ];

    const result = deriveEuRegion(regions, 'micro_business', [{ code: 'FR', product_tax_rate: 20 }]);

    expect(result).toMatchObject({
      code: 'EU',
      type: 'micro_business',
      countries: [{ code: 'FR', product_tax_rate: 20 }],
    });
  });

  it('returns undefined when there is no EU region yet', () => {
    expect(deriveEuRegion([buildRegion({ code: 'US' })], 'oss', [])).toBeUndefined();
  });
});

describe('resolveVatProcessChange', () => {
  const countries = [
    { code: 'DE', product_tax_rate: 19, shipping_tax_rate: 19 },
    { code: 'FR', product_tax_rate: 20, shipping_tax_rate: 20 },
  ];

  it('collapses the country list to its first entry when switching to micro_business', () => {
    expect(resolveVatProcessChange('micro_business', countries)).toEqual([countries[0]]);
  });

  it('leaves the country list untouched for any other process', () => {
    expect(resolveVatProcessChange('oss', countries)).toBeUndefined();
  });

  it('does nothing when the list is already empty', () => {
    expect(resolveVatProcessChange('micro_business', [])).toBeUndefined();
  });
});
