import { describe, expect, it } from 'vitest';

import { getDefaults } from '@/libs/zod';
import { OrderCalculationRequestSchema, OrderFormSchema } from '@/schemas/forms/order-form';

describe('OrderFormSchema', () => {
  const base = {
    items: [{ variant_id: 12, quantity: 2 }],
    currency_code: 'USD',
    coupon_code: null,
    customer_id: 7,
    shipping_method: 'flat_rate',
    shipping_first_name: 'John',
    shipping_last_name: 'Doe',
    shipping_address_line1: '221B Baker Street',
    shipping_address_line2: null,
    shipping_city: 'London',
    shipping_state: 'Greater London',
    shipping_postal_code: 'NW1 6XE',
    shipping_country: 'GB',
    shipping_phone: null,
    shipping_email: null,
    shipping_company: null,
    is_billing_same_as_shipping: true,
    admin_notes: null,
  };

  const separateBilling = {
    ...base,
    is_billing_same_as_shipping: false,
    billing_first_name: 'Jane',
    billing_last_name: 'Roe',
    billing_address_line1: '10 Downing Street',
    billing_address_line2: 'Flat 2',
    billing_city: 'Westminster',
    billing_state: 'Greater London',
    billing_postal_code: 'SW1A 2AA',
    billing_country: 'GB',
    billing_phone: '+44 20 7925 0918',
    billing_email: 'jane@example.com',
    billing_company: 'Acme Ltd',
  };

  it('produces the exact payload for a fully filled form billed to the shipping address', () => {
    const result = OrderFormSchema.parse(base);

    expect(result).toEqual({
      customer_id: 7,
      items: [{ variant_id: 12, quantity: 2 }],
      currency_code: 'USD',
      coupon_code: null,
      shipping_method: 'flat_rate',
      shipping_first_name: 'John',
      shipping_last_name: 'Doe',
      shipping_address_line1: '221B Baker Street',
      shipping_address_line2: null,
      shipping_city: 'London',
      shipping_state: 'Greater London',
      shipping_postcode: 'NW1 6XE',
      shipping_country: 'GB',
      shipping_phone: null,
      shipping_email: null,
      shipping_company: null,
      is_billing_same_as_shipping: true,
      billing_first_name: null,
      billing_last_name: null,
      billing_address_line1: null,
      billing_address_line2: null,
      billing_city: null,
      billing_state: null,
      billing_postcode: null,
      billing_country: null,
      billing_phone: null,
      billing_email: null,
      billing_company: null,
      admin_notes: null,
      flags: null,
      is_manual: true,
    });
  });

  it('discards billing values entirely when billing is same as shipping', () => {
    const result = OrderFormSchema.parse({ ...separateBilling, is_billing_same_as_shipping: true });

    expect(result.billing_first_name).toBeNull();
    expect(result.billing_postcode).toBeNull();
    expect(result.billing_company).toBeNull();
  });

  it('accepts a fully filled separate billing address', () => {
    const result = OrderFormSchema.safeParse(separateBilling);

    expect(result.success).toBe(true);
  });

  it('maps billing_postal_code to billing_postcode for a separate billing address', () => {
    const result = OrderFormSchema.parse(separateBilling);

    expect(result.billing_postcode).toBe('SW1A 2AA');
    expect(result.billing_first_name).toBe('Jane');
    expect(result.billing_address_line2).toBe('Flat 2');
    expect(result.billing_company).toBe('Acme Ltd');
  });

  it('reports a blank separate billing field at its own path', () => {
    const result = OrderFormSchema.safeParse({ ...separateBilling, billing_city: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['billing_city']);
      expect(result.error.issues[0].message).toBe('City is required');
    }
  });

  it('sends null for the optional billing fields left blank on a separate address', () => {
    const result = OrderFormSchema.parse({
      ...separateBilling,
      billing_address_line2: null,
      billing_phone: null,
      billing_email: null,
      billing_company: null,
    });

    expect(result.billing_address_line2).toBeNull();
    expect(result.billing_phone).toBeNull();
    expect(result.billing_email).toBeNull();
    expect(result.billing_company).toBeNull();
  });

  it('sends null for optional shipping fields left as an empty string', () => {
    const result = OrderFormSchema.parse({
      ...base,
      shipping_address_line2: '',
      shipping_phone: '',
      shipping_company: '   ',
    });

    expect(result.shipping_address_line2).toBeNull();
    expect(result.shipping_phone).toBeNull();
    expect(result.shipping_company).toBeNull();
  });

  it('sends null for optional billing fields left as an empty string', () => {
    const result = OrderFormSchema.parse({
      ...separateBilling,
      billing_address_line2: '',
      billing_company: '   ',
    });

    expect(result.billing_address_line2).toBeNull();
    expect(result.billing_company).toBeNull();
  });

  it('trims a retained optional value', () => {
    const result = OrderFormSchema.parse({ ...base, shipping_address_line2: ' Flat 2 ' });

    expect(result.shipping_address_line2).toBe('Flat 2');
  });

  it('trims the coupon code and nulls a blank one', () => {
    expect(OrderFormSchema.parse({ ...base, coupon_code: '  SAVE10  ' }).coupon_code).toBe('SAVE10');
    expect(OrderFormSchema.parse({ ...base, coupon_code: '   ' }).coupon_code).toBeNull();
    expect(OrderFormSchema.parse({ ...base, coupon_code: null }).coupon_code).toBeNull();
  });

  it('sends null rather than undefined for every omitted optional field', () => {
    const result = OrderFormSchema.parse({
      items: base.items,
      customer_id: base.customer_id,
      shipping_method: base.shipping_method,
      shipping_first_name: base.shipping_first_name,
      shipping_last_name: base.shipping_last_name,
      shipping_address_line1: base.shipping_address_line1,
      shipping_city: base.shipping_city,
      shipping_state: base.shipping_state,
      shipping_postal_code: base.shipping_postal_code,
      shipping_country: base.shipping_country,
      is_billing_same_as_shipping: true,
    });

    expect(result.currency_code).toBeNull();
    expect(result.coupon_code).toBeNull();
    expect(result.shipping_address_line2).toBeNull();
    expect(result.shipping_phone).toBeNull();
    expect(result.shipping_email).toBeNull();
    expect(result.shipping_company).toBeNull();
    expect(result.admin_notes).toBeNull();
  });

  it('defaults is_manual to true and is_billing_same_as_shipping to false', () => {
    const result = OrderFormSchema.parse({ ...separateBilling, is_billing_same_as_shipping: undefined });

    expect(result.is_manual).toBe(true);
    expect(result.is_billing_same_as_shipping).toBe(false);
  });

  it('rejects a missing customer', () => {
    expect(OrderFormSchema.safeParse({ ...base, customer_id: null }).success).toBe(false);
    expect(OrderFormSchema.safeParse({ ...base, customer_id: undefined }).success).toBe(false);
  });

  it('rejects a missing shipping method', () => {
    expect(OrderFormSchema.safeParse({ ...base, shipping_method: null }).success).toBe(false);
    expect(OrderFormSchema.safeParse({ ...base, shipping_method: '' }).success).toBe(false);
  });

  it('rejects a blank value in any required shipping field', () => {
    const requiredShippingFields = [
      'shipping_first_name',
      'shipping_last_name',
      'shipping_address_line1',
      'shipping_city',
      'shipping_state',
      'shipping_postal_code',
      'shipping_country',
    ] as const;

    requiredShippingFields.forEach((field) => {
      expect(OrderFormSchema.safeParse({ ...base, [field]: '   ' }).success).toBe(false);
      expect(OrderFormSchema.safeParse({ ...base, [field]: null }).success).toBe(false);
    });
  });

  it('getDefaults resolves only the two fields that declare a default', () => {
    const defaults = getDefaults(OrderFormSchema);

    expect(defaults).toMatchObject({
      is_billing_same_as_shipping: false,
      is_manual: true,
    });
    expect(defaults.items).toBeUndefined();
  });
});

describe('OrderCalculationRequestSchema', () => {
  it('parses an empty form snapshot into an all-null payload with no items', () => {
    const result = OrderCalculationRequestSchema.parse({});

    expect(result).toEqual({
      customer_id: null,
      items: [],
      currency_code: null,
      coupon_code: null,
      shipping_method: null,
      shipping_first_name: null,
      shipping_last_name: null,
      shipping_address_line1: null,
      shipping_address_line2: null,
      shipping_city: null,
      shipping_state: null,
      shipping_postcode: null,
      shipping_country: null,
      shipping_phone: null,
      shipping_email: null,
    });
  });

  it('accepts a half-filled form that OrderFormSchema would reject', () => {
    expect(OrderFormSchema.safeParse({ items: [{ variant_id: 12, quantity: 2 }] }).success).toBe(false);

    const result = OrderCalculationRequestSchema.parse({ items: [{ variant_id: 12, quantity: 2 }] });

    expect(result.customer_id).toBeNull();
    expect(result.shipping_method).toBeNull();
    expect(result.items).toEqual([{ variant_id: 12, quantity: 2 }]);
  });

  it('sends null for an optional field left as an empty string', () => {
    const result = OrderCalculationRequestSchema.parse({ shipping_address_line2: '' });

    expect(result.shipping_address_line2).toBeNull();
  });

  it('maps shipping_postal_code to shipping_postcode and trims the coupon code', () => {
    const result = OrderCalculationRequestSchema.parse({
      shipping_postal_code: 'NW1 6XE',
      coupon_code: '  SAVE10  ',
    });

    expect(result.shipping_postcode).toBe('NW1 6XE');
    expect(result.coupon_code).toBe('SAVE10');
  });

  it('omits the billing, notes and manual-order fields from the calculation payload', () => {
    const result = OrderCalculationRequestSchema.parse({
      billing_first_name: 'Jane',
      billing_postal_code: 'SW1A 2AA',
      shipping_company: 'Acme Ltd',
      admin_notes: 'Leave at the door',
      is_billing_same_as_shipping: false,
      is_manual: true,
    });

    expect(Object.keys(result)).not.toContain('billing_first_name');
    expect(Object.keys(result)).not.toContain('billing_postcode');
    expect(Object.keys(result)).not.toContain('shipping_company');
    expect(Object.keys(result)).not.toContain('admin_notes');
    expect(Object.keys(result)).not.toContain('is_billing_same_as_shipping');
    expect(Object.keys(result)).not.toContain('is_manual');
  });
});
