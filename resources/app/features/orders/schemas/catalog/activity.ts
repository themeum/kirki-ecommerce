import z from 'zod';

const ActivitySchema = z.object({
  id: z.number(),
  order_id: z.number(),
  activity_type: z.string(),
  description: z.string(),
  created_by: z.number().nullish(),
  author_name: z.string().nullish(),
  created_at: z.string().nullish(),
});

type Activity = z.infer<typeof ActivitySchema>;

export { ActivitySchema, type Activity };
