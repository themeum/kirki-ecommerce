import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addToCart } from './add-to-cart';

const { toastAction, toastError } = vi.hoisted(() => {
  // The cart API reads the cart cookie when its module loads.
  (globalThis as { document?: unknown }).document = { cookie: '', querySelector: () => null };

  return { toastAction: vi.fn(), toastError: vi.fn() };
});

vi.mock('../services/toast/runtime', () => ({
  toastManager: { success: vi.fn(), error: vi.fn() },
  toast: { error: toastError, action: toastAction },
}));

const IMAGE = 'https://example.test/uploads/linen-shirt.webp';

const CART = {
  cart_token: '',
  items_count: 1,
  items: [{ product: { variant_id: 12, title: 'Linen Shirt', attributes: [], media: IMAGE } }],
};

type Dispatched = { target: 'window' | 'document'; type: string; detail: unknown };

let dispatched: Dispatched[] = [];

function respondWith(ok: boolean, status: number, body: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      json: () => Promise.resolve(body),
    }),
  );
}

function record(target: Dispatched['target']) {
  return (event: Event) => {
    dispatched.push({ target, type: event.type, detail: (event as CustomEvent).detail });
    return true;
  };
}

function itemAddedEvents() {
  return dispatched.filter((event) => event.type === 'kecom:cart:item-added');
}

beforeEach(() => {
  dispatched = [];
  toastAction.mockReset();
  toastError.mockReset();
  (window as { dispatchEvent?: unknown }).dispatchEvent = record('window');
  (document as { dispatchEvent?: unknown }).dispatchEvent = record('document');
  (window as { kirki_ecommerce?: Record<string, unknown> }).kirki_ecommerce!.cart_variant_ids = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('successful add', () => {
  beforeEach(() => {
    respondWith(true, 200, { data: CART, message: 'Added', success: true });
  });

  it('sends one item-added event after cart-updated, with the add details', async () => {
    const sourceEl = { tagName: 'IMG' } as unknown as HTMLElement;

    await addToCart({ variantId: 12, qty: 2, sourceEl }).add();

    const types = dispatched.map((event) => `${event.target}:${event.type}`);
    expect(types).toEqual(['document:kecom:cart-updated', 'window:kecom:cart:item-added']);
    expect(itemAddedEvents()[0].detail).toEqual({
      variantId: 12,
      quantity: 2,
      imageUrl: IMAGE,
      sourceEl,
      cart: CART,
    });
  });

  it('gives sourceEl null when none is configured', async () => {
    await addToCart({ variantId: 12 }).add();

    expect(itemAddedEvents()[0].detail).toMatchObject({ sourceEl: null });
  });

  it('prefers the configured image URL over the cart response image', async () => {
    await addToCart({ variantId: 12, imageUrl: 'https://example.test/card.webp' }).add();

    expect(itemAddedEvents()[0].detail).toMatchObject({
      imageUrl: 'https://example.test/card.webp',
    });
  });

  it('shows the success toast by default', async () => {
    await addToCart({ variantId: 12 }).add();

    expect(toastAction).toHaveBeenCalledTimes(1);
  });

  it('hides the success toast when showSuccessToast is false, and still sends the event', async () => {
    await addToCart({ variantId: 12, showSuccessToast: false }).add();

    expect(toastAction).not.toHaveBeenCalled();
    expect(itemAddedEvents()).toHaveLength(1);
  });
});

describe('failed add', () => {
  it('sends no item-added event and shows the error toast even when the success toast is off', async () => {
    respondWith(false, 422, { message: 'Not enough stock for this variant', errors: null });

    await addToCart({ variantId: 12, showSuccessToast: false }).add();

    expect(itemAddedEvents()).toHaveLength(0);
    expect(toastError).toHaveBeenCalledWith('Not enough stock for this variant');
  });
});
