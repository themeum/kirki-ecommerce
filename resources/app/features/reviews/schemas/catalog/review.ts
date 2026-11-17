import { z } from 'zod';

export const ReviewStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SPAM: 'spam',
  TRASH: 'trash',
} as const;

export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];
export type ReviewStatusType = ReviewStatus;

export const ReviewProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string().nullish(),
});

export const ReviewSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  user_id: z.number().nullish(),
  author_name: z.string(),
  author_email: z.string(),
  rating: z.number(),
  title: z.string().nullish(),
  content: z.string(),
  status: z.custom<ReviewStatus>(),
  is_verified_purchase: z.boolean().nullish(),
  admin_reply: z.string().nullish(),
  admin_replied_at: z.string().nullish(),
  helpful_count: z.number().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  product: ReviewProductSchema.nullish(),
});

export type Review = z.infer<typeof ReviewSchema>;
