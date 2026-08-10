/**
 * Checkout API — wraps /kirki/ecommerce/v1/checkout
 */

import type { CheckoutRequest, CheckoutResponse, ApiResponse } from '../types';
import { apiRequest } from './client';

export const checkoutApi = {
  create: (checkoutData: CheckoutRequest) =>
    apiRequest<ApiResponse<CheckoutResponse>>('/checkout', {
      method: 'POST',
      body: checkoutData,
    }),
};
