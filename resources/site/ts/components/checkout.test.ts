import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkoutApi } from '../api/checkout';
import { checkout } from './checkout';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock('../api/cart', () => ({ buildCartApi: () => ({}) }));
vi.mock('../api/checkout', () => ({ checkoutApi: { create: vi.fn() } }));
vi.mock('../services/toast/runtime', () => ({
  toastManager: { success: vi.fn(), error: toastError },
}));

type PlaceableCheckout = ReturnType<typeof checkout> & { orderNotes: string };

function makeCheckout(orderNotes: string): PlaceableCheckout {
  const component = checkout() as PlaceableCheckout;

  Object.assign(component, {
    savedAddresses: [{ id: 1 }],
    selectedShippingMethod: 'method-0001',
    selectedPaymentMethod: 'paypal',
    billingSameAsShipping: true,
    cartData: { items: [{ product: { variant_id: 12 }, quantity: 1 }] },
    orderNotes,
  });

  return component;
}

beforeEach(() => {
  vi.mocked(checkoutApi.create).mockReset();
  vi.mocked(checkoutApi.create).mockResolvedValue({ data: { uuid: 'order-uuid' } } as never);

  (globalThis as { document?: unknown }).document = { querySelector: () => null };
  (window as { location?: unknown }).location = { href: 'https://example.test/checkout' };
});

describe('checkout placeOrder', () => {
  it('Customer leaves a note: sends the typed text as order_notes', async () => {
    await makeCheckout('Leave at front door').placeOrder();

    expect(checkoutApi.create).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(checkoutApi.create).mock.calls[0][0] as Record<string, unknown>;
    expect(payload.order_notes).toBe('Leave at front door');
    expect(payload).not.toHaveProperty('customer_notes');
  });

  it('Customer leaves no note: sends order_notes as null', async () => {
    await makeCheckout('').placeOrder();

    expect(checkoutApi.create).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(checkoutApi.create).mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toHaveProperty('order_notes', null);
    expect(payload).not.toHaveProperty('customer_notes');
  });
});

describe('checkout country errors', () => {
  const rejectWith = (errors: Record<string, string[]>) =>
    vi.mocked(checkoutApi.create).mockRejectedValue(
      Object.assign(new Error('Validation failed!'), { errors }),
    );

  beforeEach(() => {
    toastError.mockReset();
  });

  it('Shipping country is not sold: shows a toast and keeps the field error', async () => {
    rejectWith({ shipping_country: ['We do not sell to this country.'] });
    const component = makeCheckout('');

    await component.placeOrder();

    expect(toastError).toHaveBeenCalledWith('We do not sell to this country.');
    expect(component.shippingErrors.country).toBe('We do not sell to this country.');
  });

  it('Shipping and billing country are not sold: shows one toast', async () => {
    rejectWith({
      shipping_country: ['We do not sell to this country.'],
      billing_country: ['We do not sell to this country.'],
    });

    await makeCheckout('').placeOrder();

    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it('Another field fails: shows no toast', async () => {
    rejectWith({ shipping_city: ['The city field is required.'] });

    await makeCheckout('').placeOrder();

    expect(toastError).not.toHaveBeenCalled();
  });
});
