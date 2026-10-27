import { beforeEach, describe, expect, it } from 'vitest';

import type { AddressRule } from '../types';
import { config } from '../utils';
import type { CheckoutAddress } from './checkout-address';
import { getFieldMode, validateAddress } from './checkout-address';

function rule(
  state: AddressRule['state']['mode'],
  label: string,
  postal: AddressRule['postal_code']['mode'],
): AddressRule {
  return { state: { mode: state, label }, postal_code: { mode: postal } };
}

/**
 * Mirrors what the server publishes: GB and FR use no subdivision in an
 * address even though we hold hundreds for them, AE has no postal codes, and
 * JP calls the field a prefecture.
 */
const RULES: Record<string, AddressRule> = {
  GB: rule('optional', 'Region', 'required'),
  FR: rule('optional', 'Region', 'required'),
  US: rule('required', 'State', 'required'),
  JP: rule('required', 'Prefecture', 'required'),
  AE: rule('required', 'Emirate', 'hidden'),
};

function makeAddress(overrides: Partial<CheckoutAddress> = {}): CheckoutAddress {
  return {
    first_name: 'Ada',
    last_name: 'Lovelace',
    address_line1: '12 Analytical Way',
    address_line2: '',
    city: 'London',
    state: '',
    postal_code: 'SW1A 1AA',
    country: 'GB',
    phone: '',
    ...overrides,
  };
}

beforeEach(() => {
  config.address_rules = RULES;
});

describe('validateAddress', () => {
  it('accepts a complete address', () => {
    expect(validateAddress(makeAddress())).toEqual({});
  });

  it('reports every missing always-required field', () => {
    const errors = validateAddress(
      makeAddress({
        first_name: '',
        last_name: '',
        address_line1: '',
        city: '',
        postal_code: '',
        country: '',
      }),
    );

    expect(Object.keys(errors).sort()).toEqual([
      'address_line1',
      'city',
      'country',
      'first_name',
      'last_name',
    ]);
  });

  /**
   * The bug this change fixes. Previously a state was demanded whenever the
   * country had subdivisions in the dataset, so GB (247 council areas) and FR
   * (123 departments) blocked checkout on a field their addresses never use.
   */
  it('does not require a state for a country whose addresses do not use one', () => {
    expect(validateAddress(makeAddress({ country: 'GB', state: '' })).state).toBeUndefined();
    expect(validateAddress(makeAddress({ country: 'FR', state: '' })).state).toBeUndefined();
  });

  it('requires a state for a country whose addresses use one', () => {
    expect(validateAddress(makeAddress({ country: 'US', state: '' })).state).toBeDefined();
  });

  it('names the field using the country term', () => {
    expect(validateAddress(makeAddress({ country: 'JP', state: '' })).state).toBe(
      'Prefecture is required',
    );
    expect(validateAddress(makeAddress({ country: 'US', state: '' })).state).toBe(
      'State is required',
    );
  });

  /**
   * The second half of the same bug: a postal code was demanded from every
   * country, including those that have none.
   */
  it('does not require a postal code for a country that has none', () => {
    const errors = validateAddress(
      makeAddress({ country: 'AE', postal_code: '', state: 'Dubai' }),
    );

    expect(errors.postal_code).toBeUndefined();
  });

  it('still requires a postal code where the country uses one', () => {
    expect(
      validateAddress(makeAddress({ country: 'GB', postal_code: '' })).postal_code,
    ).toBeDefined();
  });

  it('falls back to requiring nothing when a country has no published rule', () => {
    const errors = validateAddress(
      makeAddress({ country: 'ZZ', state: '', postal_code: '' }),
    );

    expect(errors.state).toBeUndefined();
    expect(errors.postal_code).toBeUndefined();
  });

  it('rejects a malformed phone number but accepts an empty one', () => {
    expect(validateAddress(makeAddress({ phone: 'not-a-phone' })).phone).toBeDefined();
    expect(validateAddress(makeAddress({ phone: '' })).phone).toBeUndefined();
  });
});

describe('switching country', () => {
  it('changes which fields are demanded', () => {
    const address = makeAddress({ country: 'GB', state: '', postal_code: '' });

    // GB: postcode demanded, subdivision not.
    const asGb = validateAddress(address);
    expect(asGb.postal_code).toBeDefined();
    expect(asGb.state).toBeUndefined();

    // AE: the reverse - an emirate is demanded, a postcode does not exist.
    const asAe = validateAddress({ ...address, country: 'AE' });
    expect(asAe.postal_code).toBeUndefined();
    expect(asAe.state).toBe('Emirate is required');
  });

  it('changes the term used for the subdivision', () => {
    const address = makeAddress({ state: '' });

    expect(validateAddress({ ...address, country: 'US' }).state).toBe('State is required');
    expect(validateAddress({ ...address, country: 'JP' }).state).toBe('Prefecture is required');
  });
});

describe('getFieldMode', () => {
  it('reads a country rule case-insensitively', () => {
    expect(getFieldMode('jp', 'state')).toBe('required');
    expect(getFieldMode('JP', 'state')).toBe('required');
  });

  it('reports a hidden postal code', () => {
    expect(getFieldMode('AE', 'postal_code')).toBe('hidden');
  });

  it('falls back for an unknown country', () => {
    expect(getFieldMode('ZZ', 'state')).toBe('optional');
  });
});
