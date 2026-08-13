/**
 * Cart API — wraps /kirki/ecommerce/v1/cart/*
 */

import { Cookie } from '../cookie';
import type { ApiResponse, Cart, CartUpdateItem } from '../types';
import { config } from '../utils';
import { apiRequest } from './client';
import { ENDPOINTS } from './endpoints';

type CartApiOptions = {
  skipTax?: boolean;
  headers?: Record<string, string>;
}

function getCartHeaders(skipTax: boolean): Record<string, string> {
  const { cart_token_header_name, cart_token_cookie_name, header_skip_tax } = config;
  const headers: Record<string, string> = {
    [cart_token_header_name]: Cookie.get(cart_token_cookie_name) || '',
  };
  if (skipTax) {
    headers[header_skip_tax] = 'true';
  }
  return headers;
}

export function buildCartApi({ skipTax = true, headers: extraHeaders = {} }: CartApiOptions = {}) {
  const headers = { ...getCartHeaders(skipTax), ...extraHeaders };

  return {
    get: () => apiRequest<ApiResponse<Cart>>(ENDPOINTS.cart.root, { headers }),

    addItem: (variantId: number, quantity: number) =>
      apiRequest<ApiResponse<Cart>>(ENDPOINTS.cart.items, {
        method: 'POST',
        body: { variant_id: variantId, quantity },
        headers,
      }),

    updateItem: (itemId: number, quantity: number) =>
      apiRequest<{ data: CartUpdateItem; message: string; success: boolean }>(ENDPOINTS.cart.item(itemId), {
        method: 'PUT',
        body: { quantity },
        headers,
      }),

    removeItem: (itemId: number) =>
      apiRequest<{ data: CartUpdateItem; message: string; success: boolean }>(ENDPOINTS.cart.item(itemId), {
        method: 'DELETE',
        headers,
      }),

    empty: () => apiRequest<ApiResponse<void>>(ENDPOINTS.cart.root, { method: 'DELETE', headers }),

    applyCoupon: (code: string) =>
      apiRequest<ApiResponse<Cart>>(ENDPOINTS.cart.coupon, { method: 'POST', body: { code }, headers }),

    removeCoupon: () => apiRequest<ApiResponse<Cart>>(ENDPOINTS.cart.coupon, { method: 'DELETE', headers }),

    updateShipping: (shippingData: any) =>
      apiRequest<ApiResponse<Cart>>(ENDPOINTS.cart.shipping, {
        method: 'POST',
        body: shippingData,
        headers,
      }),

    update: (cartData: any) =>
      apiRequest<ApiResponse<Cart>>(ENDPOINTS.cart.root, {
        method: 'PUT',
        body: cartData,
        headers,
      }),
  };
}

export const cartApi = buildCartApi();
