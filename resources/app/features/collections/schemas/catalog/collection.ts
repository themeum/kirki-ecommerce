import { z } from 'zod';

import { MediaRefSchema } from '@/schemas/shared/media';

export const CollectionSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  banner: MediaRefSchema.nullish(),
  count: z.number().optional(),
  seo_title: z.string().nullish(),
  seo_description: z.string().nullish(),
  seo_keywords: z.union([z.array(z.string()), z.string()]).nullish(),
  is_active: z.boolean().optional(),
  ordering: z.number().optional(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type Collection = z.infer<typeof CollectionSchema>;
