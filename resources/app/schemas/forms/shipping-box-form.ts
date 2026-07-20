import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const ShippingBoxFormSchema = z.object({
  name: requiredString(__('Title is required', 'kirki-ecommerce')),
  length: z.union([z.string(), z.number()]),
  width: z.union([z.string(), z.number()]),
  height: z.union([z.string(), z.number()]),
  unit: z.enum(['cm', 'in']),
  is_default: z.boolean().optional(),
});

export type ShippingBoxFormValues = z.infer<typeof ShippingBoxFormSchema>;

export const shippingBoxDefaultValues: ShippingBoxFormValues = {
  name: '',
  length: 120,
  width: 80,
  height: 80,
  unit: 'in',
  is_default: false,
};
