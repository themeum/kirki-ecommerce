import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cartApi } from './cart';
import { themeCart } from './theme-cart';

vi.mock('./cart', () => ({
  cartApi: { get: vi.fn(), updateItem: vi.fn(), removeItem: vi.fn() },
}));

const toastError = vi.fn();
vi.mock('../services/toast/runtime', () => ({
  toastManager: { success: toastError, error: toastError },
}));

const cart = { id: 7, items_count: 3, items: [] };
let events: Event[];

beforeEach(() => {
  vi.mocked(cartApi.get).mockReset();
  vi.mocked(cartApi.updateItem).mockReset();
  vi.mocked(cartApi.removeItem).mockReset();
  toastError.mockReset();

  events = [];
  const target = new EventTarget();
  target.addEventListener('kecom:cart-updated', (event) => events.push(event));
  target.addEventListener('kecom:cart:item-added', (event) => events.push(event));
  (globalThis as { document?: unknown }).document = target;
});

describe('themeCart', () => {
  it('get: resolves with the cart data and sends no event', async () => {
    vi.mocked(cartApi.get).mockResolvedValue({ data: cart } as never);

    await expect(themeCart.get()).resolves.toBe(cart);
    expect(events).toHaveLength(0);
  });

  it('get: resolves with an empty array when there is no cart', async () => {
    vi.mocked(cartApi.get).mockResolvedValue({ data: [] } as never);

    await expect(themeCart.get()).resolves.toEqual([]);
  });

  it('updateItem: resolves with the cart and sends one kecom:cart-updated with it', async () => {
    vi.mocked(cartApi.updateItem).mockResolvedValue({ data: cart } as never);

    await expect(themeCart.updateItem(41, 2)).resolves.toBe(cart);
    expect(cartApi.updateItem).toHaveBeenCalledWith(41, 2);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('kecom:cart-updated');
    expect((events[0] as CustomEvent).detail).toBe(cart);
  });

  it('removeItem: resolves with the cart and sends one kecom:cart-updated with it', async () => {
    vi.mocked(cartApi.removeItem).mockResolvedValue({ data: [] } as never);

    await expect(themeCart.removeItem(41)).resolves.toEqual([]);
    expect(cartApi.removeItem).toHaveBeenCalledWith(41);
    expect(events.map((event) => event.type)).toEqual(['kecom:cart-updated']);
  });

  it('a rejected request rejects with the server message, sends no event and shows no toast', async () => {
    vi.mocked(cartApi.updateItem).mockRejectedValue(new Error('Not enough stock for this variant'));
    vi.mocked(cartApi.removeItem).mockRejectedValue(new Error('Cart item not found'));

    await expect(themeCart.updateItem(41, 9)).rejects.toThrow('Not enough stock for this variant');
    await expect(themeCart.removeItem(41)).rejects.toThrow('Cart item not found');
    expect(events).toHaveLength(0);
    expect(toastError).not.toHaveBeenCalled();
  });
});
