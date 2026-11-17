import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ReviewFormShape = z.object({
  rating: required(z.number().min(1).max(5).default(5), __('Rating is required', 'kirki-ecommerce')),
  title: z.string().nullish().default(''),
  content: required(z.string().default(''), __('Content is required', 'kirki-ecommerce')),
  status: z.string().default('pending'),
  admin_reply: z.string().nullish().default(''),
});

const ReviewFormSchema = prepareFormSchema(ReviewFormShape).transform((values) => ({
  rating: values.rating,
  title: values.title || null,
  content: values.content,
  status: values.status,
  admin_reply: values.admin_reply || null,
}));

type ReviewFormInput = z.input<typeof ReviewFormSchema>;
type ReviewFormPayload = z.output<typeof ReviewFormSchema>;

export { type ReviewFormInput, type ReviewFormPayload, ReviewFormSchema };
