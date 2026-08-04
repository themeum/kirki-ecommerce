import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const ProductAttributeValueSchema = z.object({
  id: z.number().optional(),
  value: z.union([z.number(), z.string()]).optional(),
  title: z.string().optional(),
  color: z.string().nullish(),
});

export const ProductAttributeFormSchema = z.object({
  id: z.number({
    required_error: __('Select a variation name', 'kirki-ecommerce'),
  }),
  name: requiredString(__('Variation name is required', 'kirki-ecommerce')),
  slug: z.string().optional(),
  type: z.string().optional().nullable(),
  values: z
    .array(ProductAttributeValueSchema)
    .min(1, __('Add at least one variation value', 'kirki-ecommerce')),
});

export type ProductAttributeFormValues = z.infer<
  typeof ProductAttributeFormSchema
>;

export type ProductAttributeValueFormValues = z.infer<
  typeof ProductAttributeValueSchema
>;
