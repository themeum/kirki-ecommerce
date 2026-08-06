import { describe, expect, it } from 'vitest';

import {
  calculateBasePricePerUnit,
  getUnitShortText,
} from '@/pages/products/product-form/sections/price/utils';

describe('getUnitShortText', () => {
  it('returns the stored value when it already reads as the display code', () => {
    expect(getUnitShortText('kg')).toBe('kg');
    expect(getUnitShortText('sqft')).toBe('sqft');
  });

  it('maps the values whose display code differs from what the API stores', () => {
    expect(getUnitShortText('l')).toBe('L');
    expect(getUnitShortText('m3')).toBe('m³');
  });

  it('returns an empty string when no unit is set', () => {
    expect(getUnitShortText(null)).toBe('');
    expect(getUnitShortText(undefined)).toBe('');
  });
});

describe('calculateBasePricePerUnit', () => {
  it('divides the price by the number of base units', () => {
    expect(
      calculateBasePricePerUnit({
        price: 10,
        total_unit_amount: 5,
        total_unit: 'kg',
        base_unit_amount: 1,
        base_unit: 'kg',
      }),
    ).toBe(2);
  });

  it('converts between units of the same group', () => {
    expect(
      calculateBasePricePerUnit({
        price: 20,
        total_unit_amount: 2,
        total_unit: 'kg',
        base_unit_amount: 100,
        base_unit: 'g',
      }),
    ).toBe(1);
  });

  it('accepts amounts coming from inputs as strings', () => {
    expect(
      calculateBasePricePerUnit({
        price: '10',
        total_unit_amount: '5',
        total_unit: 'l',
        base_unit_amount: '1',
        base_unit: 'l',
      }),
    ).toBe(2);
  });

  it('supports units that are alone in their group', () => {
    expect(
      calculateBasePricePerUnit({
        price: 30,
        total_unit_amount: 3,
        total_unit: 'sqft',
        base_unit_amount: 1,
        base_unit: 'sqft',
      }),
    ).toBe(10);
  });

  it('returns zero when the variant has no price yet', () => {
    expect(
      calculateBasePricePerUnit({
        price: null,
        total_unit_amount: 5,
        total_unit: 'kg',
        base_unit_amount: 1,
        base_unit: 'kg',
      }),
    ).toBe(0);
  });

  it('returns null when the unit setup is incomplete', () => {
    expect(
      calculateBasePricePerUnit({
        price: 10,
        total_unit_amount: null,
        total_unit: 'kg',
        base_unit_amount: 1,
        base_unit: 'kg',
      }),
    ).toBeNull();

    expect(
      calculateBasePricePerUnit({
        price: 10,
        total_unit_amount: 5,
        total_unit: 'kg',
        base_unit_amount: 1,
        base_unit: null,
      }),
    ).toBeNull();
  });

  it('returns null when the units belong to different groups', () => {
    expect(
      calculateBasePricePerUnit({
        price: 10,
        total_unit_amount: 5,
        total_unit: 'kg',
        base_unit_amount: 1,
        base_unit: 'ml',
      }),
    ).toBeNull();
  });
});
