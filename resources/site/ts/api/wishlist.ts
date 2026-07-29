/**
 * Wishlist API — localStorage-backed (no server endpoint yet).
 * Swap the storage layer for a real API call when the backend is ready.
 */

import type { WishlistItem } from '../types';

const STORAGE_KEY = 'kirki_wishlist';

function read(): WishlistItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as WishlistItem[];
  } catch {
    return [];
  }
}

function write(items: WishlistItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const wishlistApi = {
  getAll: (): WishlistItem[] => read(),

  add: (item: WishlistItem): WishlistItem[] => {
    const current = read();
    const exists = current.some((i) => i.product_id === item.product_id);
    if (exists) return current;
    const updated = [...current, item];
    write(updated);
    return updated;
  },

  remove: (productId: number): WishlistItem[] => {
    const updated = read().filter((i) => i.product_id !== productId);
    write(updated);
    return updated;
  },

  toggle: (item: WishlistItem): { items: WishlistItem[]; added: boolean } => {
    const current = read();
    const exists = current.some((i) => i.product_id === item.product_id);
    const items = exists
      ? current.filter((i) => i.product_id !== item.product_id)
      : [...current, item];
    write(items);
    return { items, added: !exists };
  },

  has: (productId: number): boolean =>
    read().some((i) => i.product_id === productId),

  count: (): number => read().length,
};
