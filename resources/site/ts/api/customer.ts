/**
 * Customer API
 */

import { apiRequest } from './client';
import { ENDPOINTS } from './endpoints';

export interface CustomerAddressPayload {
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
}

export type CustomerUpdatePayload = {
  id?: number;
  first_name?: string;
  last_name?: string;
  photo?: number | null;
  email?: string;
  phone?: string | null;
  accepts_marketing?: boolean;
  notes?: string | null;
  language?: string | null;
  tags?: string[];
  is_billing_same_as_shipping?: boolean;
  shipping_address?: CustomerAddressPayload;
  billing_address?: CustomerAddressPayload;
};

export interface CustomerResponse {
  data: any;
  message: string;
}

export const customerApi = {
  updateCustomer(id: number, payload: CustomerUpdatePayload): Promise<CustomerResponse> {
    return apiRequest<CustomerResponse>(ENDPOINTS.customer.single(id), {
      method: 'PUT',
      body: payload,
    });
  },
};
