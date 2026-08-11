import { z } from 'zod';

import { MediaRefSchema } from '@/schemas/shared/media';

export const BrandSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  logo: MediaRefSchema.nullish(),
  count: z.number().optional(),
  website_url: z.string().nullish(),
  is_active: z.boolean().optional(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type Brand = z.infer<typeof BrandSchema>;
