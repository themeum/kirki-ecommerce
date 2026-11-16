import { z } from 'zod';

export const ReviewStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ReviewStatusType = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const ReviewProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string().optional(),
});

export const ReviewSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  user_id: z.number().nullable().optional(),
  author_name: z.string(),
  author_email: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().nullable().optional(),
  content: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  is_verified_purchase: z.boolean().optional().default(false),
  created_at: z.string(),
  updated_at: z.string().optional(),
  product: ReviewProductSchema.nullable().optional(),
});

export type Review = z.infer<typeof ReviewSchema>;
