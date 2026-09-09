import z from 'zod';

export const PageSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  status: z.string(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type Page = z.infer<typeof PageSchema>;
