/**
 * API endpoint constants for the site bundle.
 * All paths are relative to the REST base URL defined in window.kirki_ecommerce.rest_url_base.
 */

export const ENDPOINTS = {
  cart: {
    root: '/cart',
    items: '/cart/items',
    item: (id: number) => `/cart/items/${id}`,
    coupon: '/cart/coupon',
    shipping: '/cart/shipping',
  },
  checkout: {
    root: '/checkout',
  },
  customer: {
    root: '/customers',
    single: (id: number) => `/customers/${id}`,
  },
  account: {
    root: '/account',
    profile: '/account/profile',
    passwordChange: '/account/password-change',
    addresses: '/account/addresses',
    orders: '/account/orders',
    resendVerificationEmail: '/account/resend-verification-email',
  },
} as const;
