/**
 * Cart API for themes, exposed as `window.kecomCart`.
 *
 * It uses the storefront cart client, so it sends the same cart token header
 * and REST nonce as the cart page. A change sends `kecom:cart-updated` on
 * `document`, as the cart page does. It never shows a toast: the caller
 * decides how to show an error.
 */

import type { Cart } from '../types';
import { cartApi } from './cart';

/** The cart, or an empty array when there is no cart. */
export type ThemeCartData = Cart | [];

export type ThemeCart = {
  get(): Promise<ThemeCartData>;
  updateItem(itemId: number, quantity: number): Promise<ThemeCartData>;
  removeItem(itemId: number): Promise<ThemeCartData>;
};

function announce(data: ThemeCartData): ThemeCartData {
  document.dispatchEvent(new CustomEvent('kecom:cart-updated', { detail: data }));
  return data;
}

export const themeCart: ThemeCart = {
  async get() {
    const response = await cartApi.get();
    return response.data;
  },

  async updateItem(itemId, quantity) {
    const response = await cartApi.updateItem(Number(itemId), Number(quantity));
    return announce(response.data as unknown as ThemeCartData);
  },

  async removeItem(itemId) {
    const response = await cartApi.removeItem(Number(itemId));
    return announce(response.data as unknown as ThemeCartData);
  },
};
