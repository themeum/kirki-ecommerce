import { describe, expect, it } from 'vitest';

import type {
  CountryTaxRate,
  TaxRegion,
} from '@/features/settings/tax/shared/lib/utils';
import {
  applyEuRegionUpdate,
  deriveEuRegion,
  resolveVatProcessChange,
} from '@/features/settings/tax/strategies/eu/lib/eu-region';

const buildRegion = (overrides: Partial<TaxRegion> & { code: string }): TaxRegion =>
  ({ is_enabled: true, ...overrides }) as TaxRegion;

const countriesOf = (region: TaxRegion): CountryTaxRate[] =>
  (region as { countries?: CountryTaxRate[] }).countries ?? [];

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
