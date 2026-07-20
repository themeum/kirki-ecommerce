import { z } from 'zod';

import {
  optionalNullableString,
  requiredString,
  slug,
} from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const CategoryFormSchema = z.object({
  name: requiredString(__('Name is required', 'kirki-ecommerce')),
  slug: slug(__('Slug is required', 'kirki-ecommerce')),
  description: optionalNullableString(),
  parent_id: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  image: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  is_active: z.boolean().optional(),
});

export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;
