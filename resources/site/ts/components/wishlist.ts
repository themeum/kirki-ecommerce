/**
 * Alpine Store: wishlistStore
 * Global wishlist state (localStorage-backed).
 */

import { wishlistApi } from '../api/wishlist';
import type { WishlistItem } from '../types';

export type WishlistStoreState = {
  items: WishlistItem[];
};

export function createWishlistStore(): WishlistStoreState & {
  init(): void;
  toggle(item: WishlistItem): void;
  remove(productId: number): void;
  has(productId: number): boolean;
  get count(): number;
} {
  return {
    items: [],

    init() {
      this.items = wishlistApi.getAll();
    },

    toggle(item: WishlistItem) {
      const { items } = wishlistApi.toggle(item);
      this.items = items;
    },

    remove(productId: number) {
      this.items = wishlistApi.remove(productId);
    },

    has(productId: number) {
      return this.items.some((i) => i.product_id === productId);
    },

    get count() {
      return this.items.length;
    },
  };
}
