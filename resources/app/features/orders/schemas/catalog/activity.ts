import z from 'zod';

const ActivityTypeSchema = z.enum([
  'order-placed',
  'payment-completed',
  'payment-failed',
  'processing',
  'fulfillment-resumed',
  'shipped',
  'delivered',
  'cancelled',
  'tracking-added',
  'archived',
  'on-hold',
  'partially-refunded',
  'refunded',
  'refund-requested',
  'refund-deleted',
  'comment-added',
]);

type ActivityType = z.infer<typeof ActivityTypeSchema>;

const ActivitySchema = z.object({
  id: z.number(),
  order_id: z.number(),
  activity_type: ActivityTypeSchema,
  description: z.string(),
  created_by: z.number().nullish(),
  author_name: z.string().nullish(),
  created_at: z.string().nullish(),
});

type Activity = z.infer<typeof ActivitySchema>;

export { ActivitySchema, ActivityTypeSchema, type Activity, type ActivityType };
