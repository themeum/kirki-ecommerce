import { z } from 'zod';

import { required } from '@/libs/zod';
import { __ } from '@/wpi18n';

export const ProductBasicsFormSchema = z.object({
  title: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  ribbon: z.string().nullish().default(''),
  slug: z.string().nullish().default(''),
  short_description: z.string().nullish().default(''),
  description: z.string().nullish().default(''),
});
