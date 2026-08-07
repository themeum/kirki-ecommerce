/**
 * Order API — wraps /kirki/ecommerce/v1/orders
 */

import type { OrderRequest, OrderResponse, ApiResponse } from '../types';
import { apiRequest } from './client';

export const orderApi = {
  create: (orderData: OrderRequest) =>
    apiRequest<ApiResponse<OrderResponse>>('/orders', {
      method: 'POST',
      body: orderData,
    }),
};
