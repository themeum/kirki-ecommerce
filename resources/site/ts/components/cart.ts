/**
 * Alpine Store: cartStore
 * Global cart state shared across all components.
 * Usage in PHP: access via $store.cartStore
 */

import { cartApi } from '../api/cart';
import type { Cart } from '../types';

export type CartStoreState = {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  open: boolean; // mini-cart drawer open state
};

export function createCartStore(): CartStoreState & {
  init(): Promise<void>;
  fetch(): Promise<void>;
  addItem(variantId: number, qty: number): Promise<void>;
  updateItem(itemId: number, qty: number): Promise<void>;
  removeItem(itemId: number): Promise<void>;
  empty(): Promise<void>;
  applyCoupon(code: string): Promise<void>;
  removeCoupon(): Promise<void>;
  get count(): number;
  get total(): number;
  openDrawer(): void;
  closeDrawer(): void;
} {
  return {
    cart: null,
    loading: false,
    error: null,
    open: false,

    async init() {
      await this.fetch();
    },

    async fetch() {
      this.loading = true;
      this.error = null;
      try {
        this.cart = await cartApi.get();
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Failed to load cart';
      } finally {
        this.loading = false;
      }
    },

    async addItem(variantId: number, qty = 1) {
      this.loading = true;
      this.error = null;
      try {
        this.cart = await cartApi.addItem(variantId, qty);
        this.open = true; // open mini-cart on add
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Could not add to cart';
      } finally {
        this.loading = false;
      }
    },

    async updateItem(itemId: number, qty: number) {
      this.loading = true;
      this.error = null;
      try {
        this.cart = await cartApi.updateItem(itemId, qty);
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Could not update item';
      } finally {
        this.loading = false;
      }
    },

    async removeItem(itemId: number) {
      this.loading = true;
      this.error = null;
      try {
        this.cart = await cartApi.removeItem(itemId);
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Could not remove item';
      } finally {
        this.loading = false;
      }
    },

    async empty() {
      this.loading = true;
      try {
        await cartApi.empty();
        this.cart = null;
      } finally {
        this.loading = false;
      }
    },

    async applyCoupon(code: string) {
      this.loading = true;
      this.error = null;
      try {
        this.cart = await cartApi.applyCoupon(code);
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Invalid coupon code';
      } finally {
        this.loading = false;
      }
    },

    async removeCoupon() {
      this.loading = true;
      try {
        this.cart = await cartApi.removeCoupon();
      } finally {
        this.loading = false;
      }
    },

    get count() {
      return this.cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    },

    get total() {
      return this.cart?.total ?? 0;
    },

    openDrawer()  { this.open = true; },
    closeDrawer() { this.open = false; },
  };
}
