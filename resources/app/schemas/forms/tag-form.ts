import { z } from 'zod';

import { __ } from '@/wpi18n';

export const TagFormSchema = z.object({
  name: z
    .string()
    .min(1, __('Name is required', 'kirki-ecommerce')),
  slug: z
    .string()
    .min(1, __('Slug is required', 'kirki-ecommerce')),
  description: z.string().optional().nullable(),
});

export type TagFormValues = z.infer<typeof TagFormSchema>;
