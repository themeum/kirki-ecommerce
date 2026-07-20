import { z } from 'zod';

import {
  optionalNullableString,
  requiredString,
  slug,
} from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const BrandFormSchema = z.object({
  name: requiredString(__('Name is required', 'kirki-ecommerce')),
  slug: slug(__('Slug is required', 'kirki-ecommerce')),
  description: optionalNullableString(),
  logo: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
});

export type BrandFormValues = z.infer<typeof BrandFormSchema>;
