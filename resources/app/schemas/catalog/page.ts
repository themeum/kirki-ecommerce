import { z } from 'zod';

export const PageItemSchema = z.object({
  id: z.number().nullable(),
  title: z.string(),
  slug: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PageItem = z.infer<typeof PageItemSchema>;
