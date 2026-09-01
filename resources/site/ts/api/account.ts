/**
 * Account API
 */

import { apiRequest } from './client';
import { ENDPOINTS } from './endpoints';

export interface ProfilePayload {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface AccountAddressPayload {
  type: 'billing' | 'shipping';
  first_name?: string;
  last_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_billing_same_as_shipping?: boolean;
}

export type OrdersPayload = {
  page: number;
  format: 'html'|'json';
};

export interface ApiResponse<T = any> {
  data?: T;
  message: string;
}

export const accountApi = {
  getOrders(payload: OrdersPayload): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.orders, {
      method: 'GET',
      params: payload,
    });
  },

  updateProfile(payload: ProfilePayload): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.profile, {
      method: 'PUT',
      body: payload,
    });
  },

  changePassword(payload: PasswordChangePayload): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.passwordChange, {
      method: 'PUT',
      body: payload,
    });
  },

  updateAddress(payload: AccountAddressPayload): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.addresses, {
      method: 'PUT',
      body: payload,
    });
  },

  resendVerificationEmail(): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.resendVerificationEmail, {
      method: 'POST',
    });
  },
};
