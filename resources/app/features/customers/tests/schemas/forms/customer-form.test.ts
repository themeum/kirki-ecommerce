import { describe, expect, it } from 'vitest';

import { CustomerFormSchema } from '@/features/customers/schemas/forms/customer-form';

describe('CustomerFormSchema', () => {
  const base = {
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    language: 'english',
    accepts_marketing: false,
    photo: null,
    shipping_address: {
      country: 'usa',
      address_line1: '1 Main St',
      address_line2: '',
      city: 'Springfield',
      state: 'IL',
      postal_code: '62704',
    },
    billing_address: {},
    is_billing_same_as_shipping: false,
    tags: [],
  };

  it('injects the customer identity into the shipping address unconditionally', () => {
    const result = CustomerFormSchema.parse(base);
    expect(result.shipping_address.first_name).toBe('Jane');
    expect(result.shipping_address.last_name).toBe('Doe');
    expect(result.shipping_address.email).toBe('jane@example.com');
    expect(result.shipping_address.phone).toBe('555-1234');
    expect(result.shipping_address.postal_code).toBe('62704');
  });

  it('injects the customer identity into billing when not same as shipping', () => {
    const result = CustomerFormSchema.parse({
      ...base,
      is_billing_same_as_shipping: false,
      billing_address: { country: 'usa', city: 'Chicago' },
    });
    expect(result.billing_address.first_name).toBe('Jane');
    expect(result.billing_address.email).toBe('jane@example.com');
    expect(result.billing_address.city).toBe('Chicago');
  });

  it('does not inject identity into billing when same as shipping', () => {
    const result = CustomerFormSchema.parse({
      ...base,
      is_billing_same_as_shipping: true,
      billing_address: {},
    });
    expect(result.billing_address.first_name).toBeNull();
    expect(result.billing_address.email).toBeNull();
  });

  it('preserves an existing billing record identity when same as shipping and untouched', () => {
    const result = CustomerFormSchema.parse({
      ...base,
      is_billing_same_as_shipping: true,
      billing_address: { first_name: 'Old', email: 'old@example.com' },
    });
    expect(result.billing_address.first_name).toBe('Old');
    expect(result.billing_address.email).toBe('old@example.com');
  });

  it('sends null for blank address fields rather than empty strings', () => {
    const result = CustomerFormSchema.parse({
      ...base,
      shipping_address: { country: '', address_line1: '', city: '', state: '', postal_code: '' },
    });
    expect(result.shipping_address.country).toBeNull();
    expect(result.shipping_address.address_line1).toBeNull();
    expect(result.shipping_address.postal_code).toBeNull();
  });

  it('collapses a media object photo to its numeric id', () => {
    const result = CustomerFormSchema.parse({
      ...base,
      photo: { id: 4, url: 'https://x/photo.png' },
    });
    expect(result.photo).toBe(4);
  });

  it('rejects a blank required first name', () => {
    expect(CustomerFormSchema.safeParse({ ...base, first_name: '  ' }).success).toBe(false);
  });

  it('rejects a missing or invalid email', () => {
    expect(CustomerFormSchema.safeParse({ ...base, email: '' }).success).toBe(false);
    expect(CustomerFormSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false);
  });

  it('accepts a valid email', () => {
    expect(CustomerFormSchema.safeParse(base).success).toBe(true);
  });
});
