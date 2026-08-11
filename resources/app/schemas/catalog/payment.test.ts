import { describe, expect, it } from 'vitest';

import { OnlinePaymentListSchema, OnlinePaymentSchema, OfflinePaymentSchema } from '@/schemas/catalog/payment';

describe('OnlinePaymentSchema', () => {
  it('accepts the documented list item (online-payments/list-6.yml)', () => {
    const result = OnlinePaymentSchema.safeParse({
      id: 'stripe',
      name: 'Stripe',
      icon: 'stripe',
      is_enabled: false,
      is_offline: false,
      description: 'Stripe payment gateway',
    });
    expect(result.success).toBe(true);
  });

  it('accepts the documented detail response with settings/fields/webhook info (online-payments/get-by-id-6.yml)', () => {
    const result = OnlinePaymentSchema.safeParse({
      id: 'stripe',
      name: 'Stripe',
      icon: 'stripe',
      is_enabled: true,
      is_offline: false,
      description: 'Stripe payment gateway',
      settings: { publishable_key: 'pk_test_x', secret_key: 'sk_test_x' },
      fields: [{ name: 'publishable_key', label: 'Publishable Key', type: 'text', required: true }],
      webhook_url: 'http://droip.local/wp-json/droip/ecommerce/v1/payment/webhook/stripe',
      webhook_events: ['checkout.session.completed'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts the settings-embedded gateway with no id and an empty array config (settings/payment.yml)', () => {
    const result = OnlinePaymentSchema.safeParse({
      is_enabled: true,
      is_offline: false,
      name: 'Cash on Delivery',
      icon: 'cash',
      instructions: 'Cash on Delivery',
      config: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts the documented installable-list item (online-payments/all-available-online-payments.yml)', () => {
    const result = OnlinePaymentSchema.safeParse({
      id: '1edc661d-227b-4ad4-ac22-4dc6b86a018d',
      name: 'Stripe',
      icon: 'stripe',
      is_installed: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an unrecognized extra field', () => {
    const result = OnlinePaymentSchema.safeParse({ id: 'stripe', unexpected: 'value' });
    expect(result.success).toBe(true);
  });

  it('accepts every optional field absent', () => {
    const result = OnlinePaymentSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('OnlinePaymentListSchema', () => {
  it('normalizes the provider-id-keyed object GET /online-payments actually returns', () => {
    const result = OnlinePaymentListSchema.safeParse({
      stripe: { id: 'stripe', name: 'Stripe', icon: 'stripe', is_enabled: false, is_offline: false },
      paypal: { id: 'paypal', name: 'Paypal', icon: 'paypal', is_enabled: true, is_offline: false },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data.map((gateway) => gateway.id)).toEqual(['stripe', 'paypal']);
    }
  });

  it('also accepts a genuine array, unchanged', () => {
    const result = OnlinePaymentListSchema.safeParse([{ id: 'stripe', name: 'Stripe' }]);
    expect(result.success).toBe(true);
  });
});

describe('OfflinePaymentSchema', () => {
  it('accepts the documented list item (offline-payments/list-4.yml)', () => {
    const result = OfflinePaymentSchema.safeParse({
      id: 'fdsf',
      name: 'Cash on Delivery',
      icon: 'cash',
      is_enabled: true,
      is_offline: true,
      instructions: 'Cash on Delivery',
      config: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a method with every field null (offline-payments/list-4.yml, Paddle entry)', () => {
    const result = OfflinePaymentSchema.safeParse({
      id: '3edc661d-227b-4ad8-ac22-4dc6b86a018d',
      name: 'Paddle',
      icon: 'paddle',
      is_enabled: null,
      is_offline: null,
      instructions: null,
      config: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts the optional fields being absent beyond id', () => {
    const result = OfflinePaymentSchema.safeParse({ id: 'fdsf' });
    expect(result.success).toBe(true);
  });
});
