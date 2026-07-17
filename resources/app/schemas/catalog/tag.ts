import { z } from 'zod';

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  count: z.number().optional(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type Tag = z.infer<typeof TagSchema>;
