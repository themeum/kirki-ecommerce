import { describe, expect, it } from 'vitest';

import {
  getDestinationDisplayValue,
  resolveActionLabel,
  resolveConditionDisplayValue,
  resolveConditionTypeLabel,
  resolveOperatorLabel,
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

describe('resolveConditionTypeLabel', () => {
  it('reads a condition key as the wording the rule editor offers', () => {
    expect(resolveConditionTypeLabel('tax_profile')).toBe('Tax Profile');
    expect(resolveConditionTypeLabel('destination_region')).toBe('Destination');
  });

  it('falls back to the raw key for a condition the editor does not offer', () => {
    expect(resolveConditionTypeLabel('cart_weight')).toBe('cart_weight');
  });

  it('returns nothing for an unset type', () => {
    expect(resolveConditionTypeLabel(undefined)).toBe('');
  });
});

describe('resolveOperatorLabel', () => {
  it('reads the equality operator as a sentence', () => {
    expect(resolveOperatorLabel('=')).toBe('is');
  });

  it('names the comparison operators the decision engine evaluates', () => {
    expect(resolveOperatorLabel('!=')).toBe('is not');
    expect(resolveOperatorLabel('>')).toBe('is greater than');
    expect(resolveOperatorLabel('<')).toBe('is less than');
    expect(resolveOperatorLabel('>=')).toBe('is at least');
    expect(resolveOperatorLabel('<=')).toBe('is at most');
    expect(resolveOperatorLabel('in')).toBe('is one of');
    expect(resolveOperatorLabel('!in')).toBe('is not one of');
  });

  it('reads an unset operator as equality', () => {
    expect(resolveOperatorLabel(undefined)).toBe('is');
  });
});

describe('resolveActionLabel', () => {
  it('completes the sentence for a rate action, which is followed by the rate', () => {
    expect(resolveActionLabel('set_product_tax_rate')).toBe('product tax rate is');
  });

  it('completes the sentence for an exemption, which stands alone', () => {
    expect(resolveActionLabel('set_product_tax_exempt')).toBe('product tax is exempt');
  });

  it('falls back to the raw key for an action the tax editor does not offer', () => {
    expect(resolveActionLabel('set_shipping_cost')).toBe('set_shipping_cost');
  });

  it('returns nothing for an unset action', () => {
    expect(resolveActionLabel(null)).toBe('');
  });
});
