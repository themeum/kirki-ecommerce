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
  label?: string;
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
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

export type OrdersPayload = {
  page: number;
  format: 'html' | 'json';
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

  createAddress(payload: AccountAddressPayload): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.addresses, {
      method: 'POST',
      body: payload,
    });
  },

  editAddress(id: number | string, payload: AccountAddressPayload): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.addressSingle(id), {
      method: 'PUT',
      body: payload,
    });
  },

  deleteAddress(id: number | string): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.addressSingle(id), {
      method: 'DELETE',
    });
  },

  setDefaultAddress(id: number | string, type: 'shipping' | 'billing'): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.addressSetDefault(id), {
      method: 'PUT',
      body: { type },
    });
  },

  resendVerificationEmail(): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.resendVerificationEmail, {
      method: 'POST',
    });
  },
};
