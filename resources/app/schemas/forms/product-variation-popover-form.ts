import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const ProductVariationPopoverFormSchema = z.object({
  title: requiredString(__('Title is required', 'kirki-ecommerce')),
  value: z.string().optional(),
  color: requiredString(__('Color is required', 'kirki-ecommerce')),
});

export type ProductVariationPopoverFormValues = z.infer<
  typeof ProductVariationPopoverFormSchema
>;
