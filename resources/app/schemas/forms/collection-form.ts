import { z } from 'zod';

import { optionalNullableString, requiredString, slug } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const CollectionFormSchema = z.object({
  title: requiredString(__('Title is required', 'kirki-ecommerce')),
  slug: slug(__('Slug is required', 'kirki-ecommerce')),
  description: optionalNullableString(),
  banner: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  seo_title: optionalNullableString(),
  seo_description: optionalNullableString(),
});

export type CollectionFormValues = z.infer<typeof CollectionFormSchema>;
