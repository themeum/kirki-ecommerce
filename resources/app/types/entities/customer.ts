import type { MediaRef } from './media';

type CustomerAddress = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  [key: string]: unknown;
};

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  language?: string;
  accepts_marketing?: boolean;
  photo?: MediaRef | number | null;
  orders_count?: number;
  amount_spent?: number | string;
  location?: string;
  last_order_date?: string;
  created_at?: string;
  shipping_address?: CustomerAddress;
  billing_address?: CustomerAddress;
  is_billing_same_as_shipping?: boolean;
  tags?: string[];
};

type CustomerFormData = {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  language?: string;
  accepts_marketing?: boolean;
  photo?: MediaRef | number | null;
  shipping_address?: CustomerAddress;
  billing_address?: CustomerAddress;
  is_billing_same_as_shipping?: boolean;
  tags?: string[];
  [key: string]: unknown;
};

export type { Customer, CustomerFormData, CustomerAddress };
