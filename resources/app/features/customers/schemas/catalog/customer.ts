import { z } from 'zod';

import { MoneyAmountSchema } from '@/schemas/shared/api';
import { MediaRefSchema } from '@/schemas/shared/media';

export const CustomerAddressSchema = z.object({
  id: z.number().optional(),
  customer_id: z.number().optional(),
  first_name: z.string().optional(),
  last_name: z.string().nullish(),
  email: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().nullish(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  type: z.union([z.enum(['billing', 'shipping']), z.string()]).optional(),
});

export type CustomerAddress = z.infer<typeof CustomerAddressSchema>;

export const CustomerInfoSchema = z.object({
  id: z.number(),
  user_id: z.number().nullish(),
  first_name: z.string(),
  last_name: z.string().nullish(),
  email: z.string(),
  phone: z.string().nullish(),
  photo: MediaRefSchema.nullish(),
});

export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;

export const CustomerListItemSchema = z.object({
  id: z.number(),
  user_id: z.number().nullish(),
  first_name: z.string(),
  last_name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullish(),
  photo: MediaRefSchema.nullish(),
  base_amount_spent: MoneyAmountSchema.optional(),
  base_amount_spent_money_object: z.any(),
  display_amount_spent: MoneyAmountSchema.optional(),
  display_amount_spent_money_object: z.any(),
  location: z.string().optional(),
  orders_count: z.number().optional(),
  last_order_date: z.string().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type CustomerListItem = z.infer<typeof CustomerListItemSchema>;

export const CustomerSchema = z.object({
  id: z.number(),
  user_id: z.number().nullish(),
  first_name: z.string(),
  last_name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullish(),
  photo: MediaRefSchema.nullish(),
  shipping_address: CustomerAddressSchema.nullish(),
  is_billing_same_as_shipping: z.boolean().optional(),
  billing_address: CustomerAddressSchema.nullish(),
  tags: z.array(z.string()).optional(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type Customer = z.infer<typeof CustomerSchema>;
