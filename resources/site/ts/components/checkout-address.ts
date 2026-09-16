/**
 * Checkout Address types, initializers, and validation logic
 */

import { config } from '../utils';
import type { CountryState } from './address-modal';

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

export function validateAddress(
  address: CheckoutAddress,
  states: CountryState[],
): Record<string, string> {
  const { __ } = window.wp.i18n;
  const errors: Record<string, string> = {};

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
  if (states.length > 0 && !address.state?.toString().trim()) {
    errors.state = __('State is required', 'kirki-ecommerce');
  }
  if (!address.postal_code?.trim()) {
    errors.postal_code = __('Postal code is required', 'kirki-ecommerce');
  }
  if (address.phone && !/^\+?(?=(?:\D*\d){7,15}\D*$)[\d\s().-]+$/.test(address.phone)) {
    errors.phone = __('Please enter a valid phone number.', 'kirki-ecommerce');
  }

  return errors;
}
