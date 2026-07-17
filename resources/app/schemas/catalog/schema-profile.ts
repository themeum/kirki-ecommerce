import { z } from 'zod';

export const SchemaProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_default: z.boolean().optional(),
  schema: z.record(z.array(z.string())),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type SchemaProfile = z.infer<typeof SchemaProfileSchema>;
