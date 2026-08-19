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
  password: string;
  password_confirmation: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message: string;
}

export const accountApi = {
  updateProfile(payload: ProfilePayload): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.profile, {
      method: 'POST',
      body: payload,
    });
  },

  changePassword(payload: PasswordChangePayload): Promise<ApiResponse> {
    return apiRequest<ApiResponse>(ENDPOINTS.account.passwordChange, {
      method: 'POST',
      body: payload,
    });
  },
};
