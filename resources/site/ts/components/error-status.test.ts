import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addToCart } from './add-to-cart';
import { cart } from './cart';
import { checkout } from './checkout';

const { toastManagerError, toastError } = vi.hoisted(() => {
  // The cart API reads the cart cookie when its module loads.
  (globalThis as { document?: unknown }).document = { cookie: '', querySelector: () => null };

  return { toastManagerError: vi.fn(), toastError: vi.fn() };
});

vi.mock('../services/toast/runtime', () => ({
  toastManager: { success: vi.fn(), error: toastManagerError },
  toast: { error: toastError, action: vi.fn() },
}));

const STOCK_MESSAGE = 'Not enough stock for this variant';

/**
 * The server answers a stock failure with 422 and no field errors. Each shopper action must
 * still tell the shopper why, through the real request client.
 */
function respondWith(status: number, body: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      statusText: 'Error',
      json: () => Promise.resolve(body),
    }),
  );
}

beforeEach(() => {
  toastManagerError.mockReset();
  toastError.mockReset();
  (window as { location?: unknown }).location = { href: 'https://example.test/checkout' };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each([422, 500])('stock failure answered with %i', (status) => {
  beforeEach(() => {
    respondWith(status, { message: STOCK_MESSAGE, errors: null });
  });

  it('Cart quantity change: shows the server message in a toast', async () => {
    await cart().update(1, 99);

    expect(toastManagerError).toHaveBeenCalledWith(STOCK_MESSAGE);
  });

  it('Add to cart: shows the server message in a toast and frees the button', async () => {
    const component = addToCart({ variantId: 12 }) as ReturnType<typeof addToCart> & {
      loading: boolean;
    };

    await component.add();

    expect(toastError).toHaveBeenCalledWith(STOCK_MESSAGE);
    expect(component.loading).toBe(false);
  });

  it('Checkout: shows the server message in a toast and frees the form', async () => {
    const component = checkout() as ReturnType<typeof checkout> & { loading: boolean };
    Object.assign(component, {
      savedAddresses: [{ id: 1 }],
      selectedShippingMethod: 'method-0001',
      selectedPaymentMethod: 'cod',
      billingSameAsShipping: true,
      cartData: { items: [{ product: { variant_id: 12 }, quantity: 1 }] },
    });

    await component.placeOrder();

    expect(toastManagerError).toHaveBeenCalledWith(STOCK_MESSAGE);
    expect(component.loading).toBe(false);
  });
});

describe('checkout error keyed by a field the form does not show', () => {
  it('Stock error under items: shows its message in a toast', async () => {
    respondWith(422, {
      message: 'Not enough stock for variant: 12',
      errors: { items: ['Not enough stock for variant: 12'] },
    });
    const component = checkout();
    Object.assign(component, {
      savedAddresses: [{ id: 1 }],
      selectedShippingMethod: 'method-0001',
      selectedPaymentMethod: 'cod',
      billingSameAsShipping: true,
      cartData: { items: [{ product: { variant_id: 12 }, quantity: 1 }] },
    });

    await component.placeOrder();

    expect(toastManagerError).toHaveBeenCalledWith('Not enough stock for variant: 12');
  });
});
