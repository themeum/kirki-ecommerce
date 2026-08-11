import { z } from 'zod';

import { MediaRefSchema } from '@/schemas/shared/media';

export const CategorySchema = z.object({
  id: z.number(),
  parent_id: z.number().nullish(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  image: MediaRefSchema.nullish(),
  count: z.number().optional(),
  level: z.number().optional(),
  ordering: z.number().optional(),
  is_active: z.boolean().optional(),
  is_deletable: z.boolean().optional(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type Category = z.infer<typeof CategorySchema>;
