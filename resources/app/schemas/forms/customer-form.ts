import { z } from 'zod';

import { email, optionalNullableString, requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

const AddressSchema = z.object({
  id: z.number().optional(),
  customer_id: z.number().optional(),
  first_name: z.string().optional(),
  last_name: optionalNullableString(),
  email: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: optionalNullableString(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  type: z.string().optional(),
});

export const CustomerFormSchema = z.object({
  first_name: requiredString(__('First name is required', 'kirki-ecommerce')),
  last_name: optionalNullableString(),
  email: email(),
  phone: optionalNullableString(),
  language: z.string().optional(),
  accepts_marketing: z.boolean().optional(),
  photo: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  shipping_address: AddressSchema.optional().nullable(),
  billing_address: AddressSchema.optional().nullable(),
  is_billing_same_as_shipping: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type CustomerFormValues = z.infer<typeof CustomerFormSchema>;
