import { describe, expect, it } from 'vitest';

import {
  getDestinationDisplayValue,
  resolveConditionDisplayValue,
  resolveSelectedDestinations,
} from '@/features/settings/tax/shared/lib/tax-rules/helper';

describe('resolveSelectedDestinations', () => {
  it('reads a general region destination from its state list', () => {
    expect(resolveSelectedDestinations({ country: 'US', state: ['5665', '5666'] })).toEqual([
      '5665',
      '5666',
    ]);
  });

  it('reads an EU region destination from its country list', () => {
    expect(resolveSelectedDestinations({ country: ['AT', 'BE'] })).toEqual(['AT', 'BE']);
  });

  it('accepts a legacy bare array', () => {
    expect(resolveSelectedDestinations(['5665'])).toEqual(['5665']);
  });

  it('returns an empty list for an unset value', () => {
    expect(resolveSelectedDestinations(null)).toEqual([]);
  });
});

describe('getDestinationDisplayValue', () => {
  it('summarises an object destination', () => {
    expect(getDestinationDisplayValue({ country: 'US', state: ['5665', '5666', '5667'] })).toBe(
      '5665 +2…',
    );
  });

  it('falls back to the placeholder when nothing is selected', () => {
    expect(getDestinationDisplayValue({ country: 'US', state: [] })).toBe('Select regions');
  });
});

describe('resolveConditionDisplayValue', () => {
  const profiles = [
    { id: 1, name: 'Standard Rate' },
    { id: 2, name: 'Reduced Rate' },
  ];

  it('resolves a tax_profile id to its name', () => {
    expect(
      resolveConditionDisplayValue({ type: 'tax_profile', operator: '=', value: '2' }, profiles),
    ).toBe('Reduced Rate');
  });

  it('passes other condition values through as a string', () => {
    expect(
      resolveConditionDisplayValue({ type: 'product_categories', operator: 'in', value: 3 }, profiles),
    ).toBe('3');
  });
});
