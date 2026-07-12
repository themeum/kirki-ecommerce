import type { MediaRef } from './media';

type CustomerAddress = {
  id?: number;
  customer_id?: number;
  first_name?: string;
  last_name?: string | null;
  email?: string;
  phone?: string;
  country?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state?: string;
  postal_code?: string;
  type?: 'billing' | 'shipping' | string;
};

type CustomerListItem = {
  id: number;
  user_id?: number | null;
  first_name: string;
  last_name: string | null;
  email: string;
  phone?: string | null;
  photo?: MediaRef | number | null;
  orders_count?: number;
  amount_spent?: number | string;
  location?: string;
  last_order_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Customer = {
  id: number;
  user_id?: number | null;
  first_name: string;
  last_name: string | null;
  email: string;
  phone?: string | null;
  language?: string;
  accepts_marketing?: boolean;
  photo?: MediaRef | number | null;
  shipping_address?: CustomerAddress | null;
  billing_address?: CustomerAddress | null;
  is_billing_same_as_shipping?: boolean;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  orders_count?: number;
  amount_spent?: number | string;
  location?: string;
  last_order_date?: string | null;
};

type CustomerFormData = {
  id?: number;
  first_name?: string;
  last_name?: string | null;
  email?: string;
  phone?: string | null;
  language?: string;
  accepts_marketing?: boolean;
  photo?: MediaRef | number | null;
  shipping_address?: CustomerAddress | null;
  billing_address?: CustomerAddress | null;
  is_billing_same_as_shipping?: boolean;
  tags?: string[];
};

export type {
  Customer,
  CustomerListItem,
  CustomerFormData,
  CustomerAddress,
};
