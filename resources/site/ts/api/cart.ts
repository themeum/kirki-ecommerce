/**
 * Cart API — wraps /kirki/ecommerce/v1/cart/*
 */

import type { Cart, CartUpdateItem } from '../types';
import { apiRequest } from './client';

export const cartApi = {
  get: () =>
    apiRequest<Cart>('/cart'),

  addItem: (variantId: number, quantity: number) =>
    apiRequest<Cart>('/cart/items', {
      method: 'POST',
      body: { variant_id: variantId, quantity },
    }),

  updateItem: (itemId: number, quantity: number) =>
    apiRequest<{ data: CartUpdateItem, message: string, success: boolean }>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: { quantity },
    }),

  removeItem: (itemId: number) =>
    apiRequest<{ data: CartUpdateItem, message: string, success: boolean }>(`/cart/items/${itemId}`, { method: 'DELETE' }),

  empty: () =>
    apiRequest<void>('/cart', { method: 'DELETE' }),

  applyCoupon: (code: string) =>
    apiRequest<Cart>('/cart/coupon', { method: 'POST', body: { code } }),

  removeCoupon: () =>
    apiRequest<Cart>('/cart/coupon', { method: 'DELETE' }),
};
