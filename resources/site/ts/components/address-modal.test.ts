import { beforeEach, describe, expect, it } from 'vitest';

import type { AddressRule } from '../types';
import { config } from '../utils';
import type { AddressModalHost, CountryItem } from './address-modal';
import { createAddressModal } from './address-modal';

function rule(
  state: AddressRule['state']['mode'],
  label: string,
  postal: AddressRule['postal_code']['mode'],
): AddressRule {
  return { state: { mode: state, label }, postal_code: { mode: postal } };
}

/**
 * GB holds subdivisions in the dataset but does not require one in an
 * address - the case the old "has states, therefore required" check got
 * wrong. AE has no postal code at all.
 */
const RULES: Record<string, AddressRule> = {
  GB: rule('optional', 'Region', 'required'),
  US: rule('required', 'State', 'required'),
  JP: rule('required', 'Prefecture', 'required'),
  AE: rule('required', 'Emirate', 'hidden'),
};

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', states: [{ id: 1, name: 'Greater London' }] },
  { code: 'US', name: 'United States', states: [{ id: 2, name: 'California' }] },
  { code: 'AE', name: 'United Arab Emirates', states: [{ id: 3, name: 'Dubai' }] },
] as unknown as CountryItem[];

/**
 * `createAddressModal` returns the shared half of an Alpine component; the
 * view supplies `countries`. Stitch the two together so the methods run
 * against the same shape they do in the browser.
 */
function makeModal(overrides: Record<string, unknown> = {}): AddressModalHost {
  // Assigned onto the object rather than spread into a new one: `addressRule`
  // and `availableStates` are getters, and a spread would freeze them to
  // whatever they evaluated to for an empty form.
  const modal = createAddressModal();
  Object.assign(modal, { countries: COUNTRIES });

  Object.assign(modal.formData, {
    type: 'home',
    first_name: 'Ada',
    last_name: 'Lovelace',
    company: '',
    country: 'GB',
    address_line1: '12 Analytical Way',
    address_line2: '',
    city: 'London',
    state: '',
    postal_code: 'SW1A 1AA',
    phone: '+44 20 7946 0000',
    email: 'ada@example.test',
    ...overrides,
  });

  return modal as unknown as AddressModalHost;
}

beforeEach(() => {
  config.address_rules = RULES;
  config.countries = COUNTRIES as never;
});

describe('createAddressModal validateForm', () => {
  it('accepts an address with no state when the country does not require one', () => {
    const modal = makeModal();

    expect(modal.validateForm()).toBe(true);
    expect(modal.errors.state).toBeUndefined();
  });

  it('rejects a missing state when the country requires one', () => {
    const modal = makeModal({ country: 'US', state: '' });

    expect(modal.validateForm()).toBe(false);
    expect(modal.errors.state).toBe('State is required.');
  });

  it('names the country term rather than always saying State', () => {
    const modal = makeModal({ country: 'JP', state: '' });

    expect(modal.validateForm()).toBe(false);
    expect(modal.errors.state).toBe('Prefecture is required.');
  });

  it('accepts an address with no postal code when the country has none', () => {
    const modal = makeModal({ country: 'AE', state: 'Dubai', postal_code: '' });

    expect(modal.validateForm()).toBe(true);
    expect(modal.errors.postal_code).toBeUndefined();
  });

  it('still rejects a missing postal code where the country uses one', () => {
    const modal = makeModal({ postal_code: '' });

    expect(modal.validateForm()).toBe(false);
    expect(modal.errors.postal_code).toBe('Postal code is required.');
  });
});
