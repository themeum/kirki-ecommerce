import type { MediaRef } from '@/types/entities/media';

type OrderCustomer = {
  name?: string;
  email?: string;
  phone?: string;
  photo?: MediaRef | string | null;
  billing_address?: string;
  shipping_address?: string;
};

type OrderItem = {
  id: number;
  title?: string;
  subtitle?: string;
  image?: MediaRef | null;
  price?: number | string;
  quantity?: number;
  total?: number | string;
};

type OrderPayment = {
  items?: number | string;
  shipping?: number | string;
  tax?: number | string;
  total?: number | string;
  status?: string;
  method?: string;
};

type Order = {
  id: number;
  number?: string | number;
  quantity?: number;
  price?: number | string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  date?: string;
  is_manual?: boolean;
  customer_name?: string;
  customer?: OrderCustomer;
  items?: OrderItem[];
  payment?: OrderPayment;
  flag?: string;
};

export type { Order, OrderCustomer, OrderItem, OrderPayment };
