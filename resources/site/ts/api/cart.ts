/**
 * Cart API — wraps /kirki/ecommerce/v1/cart/*
 */

import type { Cart, CartUpdateItem, ApiResponse } from '../types';
import { apiRequest } from './client';
import { Cookie } from '../cookie';

function getConfig() {
  if (!window.kirki_ecommerce) {
    throw new Error('[kecom] window.kirki_ecommerce is not defined. Did you forget wp_localize_script?');
  }
  return window.kirki_ecommerce;
}

const { cart_token_header_name, cart_token_cookie_name } = getConfig();
const headers = {
  [cart_token_header_name]: Cookie.get(cart_token_cookie_name) || '',
}

export const cartApi = {
  get: () =>
    apiRequest<ApiResponse<Cart>>('/cart'),

  addItem: (variantId: number, quantity: number) =>
    apiRequest<ApiResponse<Cart>>('/cart/items', {
      method: 'POST',
      body: { variant_id: variantId, quantity },
      headers: headers,
    }),

  updateItem: (itemId: number, quantity: number) =>
    apiRequest<{ data: CartUpdateItem, message: string, success: boolean }>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: { quantity },
    }),

  removeItem: (itemId: number) =>
    apiRequest<{ data: CartUpdateItem, message: string, success: boolean }>(`/cart/items/${itemId}`, { method: 'DELETE' }),

  empty: () =>
    apiRequest<ApiResponse<void>>('/cart', { method: 'DELETE' }),

  applyCoupon: (code: string) =>
    apiRequest<ApiResponse<Cart>>('/cart/coupon', { method: 'POST', body: { code } }),

  removeCoupon: () =>
    apiRequest<ApiResponse<Cart>>('/cart/coupon', { method: 'DELETE' }),
};
