/**
 * Checkout API — wraps /kirki/ecommerce/v1/checkout
 */

import type { CheckoutRequest, CheckoutResponse, ApiResponse } from "../types";
import { apiRequest } from "./client";
import { ENDPOINTS } from "./endpoints";

export const checkoutApi = {
  create: (checkoutData: CheckoutRequest) =>
    apiRequest<ApiResponse<CheckoutResponse>>(ENDPOINTS.checkout.root, {
      method: "POST",
      body: checkoutData,
    }),
};
