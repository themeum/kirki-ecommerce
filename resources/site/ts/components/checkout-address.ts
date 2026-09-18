/**
 * Checkout Address types, initializers, and validation logic
 */

import type { AddressFieldMode, AddressRule } from '../types';
import { config } from '../utils';
import type { CountryState } from './address-modal';

/**
 * Used when a country has no published rule. Built per call rather than held
 * in a module constant so the label is translated at call time, after
 * wp.i18n is available.
 */
function fallbackRule(): AddressRule {
  return {
    state: { mode: 'optional', label: window.wp.i18n.__('Region', 'kirki-ecommerce') },
    postal_code: { mode: 'optional' },
  };
}

export function getAddressRule(code: string): AddressRule {
  if (!code) {
    return fallbackRule();
  }
  return config.address_rules?.[code.toUpperCase()] ?? fallbackRule();
}

export function getFieldMode(code: string, field: keyof AddressRule): AddressFieldMode {
  return getAddressRule(code)[field].mode;
}

export function getStatesForCountry(
  code: string,
  countries: any[] = config.countries ?? [],
): CountryState[] {
  if (!code) {
    return [];
  }
  const country = countries.find((c: any) => c.code === code);
  return country?.states ?? [];
}

export interface CheckoutAddress {
  id?: number | string | null;
  first_name: string;
  last_name: string;
  company?: string | null;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email?: string;
}

export function initAddress(source?: any, fallbackCountry = ''): CheckoutAddress {
  return {
    id: source?.id ?? null,
    first_name: source?.first_name || '',
    last_name: source?.last_name || '',
    company: source?.company || '',
    address_line1: source?.address_line1 || '',
    address_line2: source?.address_line2 || '',
    city: source?.city || '',
    state: String(source?.state || ''),
    postal_code: source?.postal_code || '',
    country: source?.country || fallbackCountry,
    phone: source?.phone || '',
    email: source?.email || '',
  };
}

export function formatAddressPayload(address: CheckoutAddress): Record<string, string> {
  return {
    ...(address.id ? { id: String(address.id) } : {}),
    first_name: address.first_name || '',
    last_name: address.last_name || '',
    email: address.email || '',
    phone: address.phone || '',
    address_line1: address.address_line1 || '',
    address_line2: address.address_line2 || '',
    city: address.city || '',
    state: String(address.state || ''),
    postal_code: address.postal_code || '',
    country: address.country || '',
  };
}

import type { CheckoutRequest } from '../types';

export type ShippingOrderFields = Pick<
  CheckoutRequest,
  | 'shipping_id'
  | 'shipping_first_name'
  | 'shipping_last_name'
  | 'shipping_address_line1'
  | 'shipping_address_line2'
  | 'shipping_city'
  | 'shipping_state'
  | 'shipping_postal_code'
  | 'shipping_country'
  | 'shipping_phone'
  | 'shipping_company'
>;

export type BillingOrderFields = Pick<
  CheckoutRequest,
  | 'billing_id'
  | 'billing_first_name'
  | 'billing_last_name'
  | 'billing_address_line1'
  | 'billing_address_line2'
  | 'billing_city'
  | 'billing_state'
  | 'billing_postal_code'
  | 'billing_country'
  | 'billing_phone'
  | 'billing_company'
>;

export function toShippingOrderFields(address: CheckoutAddress): ShippingOrderFields {
  return {
    shipping_id: address.id || '',
    shipping_first_name: address.first_name || '',
    shipping_last_name: address.last_name || '',
    shipping_address_line1: address.address_line1 || '',
    shipping_address_line2: address.address_line2 || '',
    shipping_city: address.city || '',
    shipping_state: String(address.state || ''),
    shipping_postal_code: address.postal_code || '',
    shipping_country: address.country || '',
    shipping_phone: address.phone || '',
    shipping_company: address.company || null,
  };
}

export function toBillingOrderFields(address: CheckoutAddress): BillingOrderFields {
  return {
    billing_id: address.id || '',
    billing_first_name: address.first_name || '',
    billing_last_name: address.last_name || '',
    billing_address_line1: address.address_line1 || '',
    billing_address_line2: address.address_line2 || '',
    billing_city: address.city || '',
    billing_state: String(address.state || ''),
    billing_postal_code: address.postal_code || '',
    billing_country: address.country || '',
    billing_phone: address.phone || '',
    billing_company: address.company || null,
  };
}

export function validateAddress(address: CheckoutAddress): Record<string, string> {
  const { __, sprintf } = window.wp.i18n;
  const errors: Record<string, string> = {};
  const rule = getAddressRule(address.country);

  if (!address.country?.trim()) {
    errors.country = __('Country is required', 'kirki-ecommerce');
  }
  if (!address.first_name?.trim()) {
    errors.first_name = __('First name is required', 'kirki-ecommerce');
  }
  if (!address.last_name?.trim()) {
    errors.last_name = __('Last name is required', 'kirki-ecommerce');
  }
  if (!address.address_line1?.trim()) {
    errors.address_line1 = __('Address is required', 'kirki-ecommerce');
  }
  if (!address.city?.trim()) {
    errors.city = __('City is required', 'kirki-ecommerce');
  }
  if (rule.state.mode === 'required' && !address.state?.toString().trim()) {
    // The label is the country's own term, so a Japanese address asks for a
    // prefecture rather than a state.
    errors.state = sprintf(
      /* translators: %s is the country's term for its subdivision, e.g. State, Prefecture, Emirate. */
      __('%s is required', 'kirki-ecommerce'),
      rule.state.label,
    );
  }
  if (rule.postal_code.mode === 'required' && !address.postal_code?.trim()) {
    errors.postal_code = __('Postal code is required', 'kirki-ecommerce');
  }
  if (address.phone && !/^\+?(?=(?:\D*\d){7,15}\D*$)[\d\s().-]+$/.test(address.phone)) {
    errors.phone = __('Please enter a valid phone number.', 'kirki-ecommerce');
  }

  return errors;
}
