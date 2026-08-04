/**
 * Cart API — wraps /kirki/ecommerce/v1/cart/*
 */

import { apiRequest } from './client';
import type { Cart, ApiResponse } from '../types';

export const cartApi = {
  get: () =>
    apiRequest<ApiResponse<Cart>>('/cart'),

  addItem: (variantId: number, quantity: number) =>
    apiRequest<ApiResponse<Cart>>('/cart/items', {
      method: 'POST',
      body: { variant_id: variantId, quantity },
    }),

  updateItem: (itemId: number, quantity: number) =>
    apiRequest<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: { quantity },
    }),

  removeItem: (itemId: number) =>
    apiRequest<ApiResponse<Cart>>(`/cart/items/${itemId}`, { method: 'DELETE' }),

  empty: () =>
    apiRequest<ApiResponse<void>>('/cart', { method: 'DELETE' }),

  applyCoupon: (code: string) =>
    apiRequest<ApiResponse<Cart>>('/cart/coupon', { method: 'POST', body: { code } }),

  removeCoupon: () =>
    apiRequest<ApiResponse<Cart>>('/cart/coupon', { method: 'DELETE' }),
};
