import z from 'zod';

import { required } from '@/libs/zod';

const ActivityFormSchema = z.object({
  message: required(z.string().nullish(), 'Message is required'),
  notify_customer: z.boolean().optional(),
});

type ActivityFormInput = z.input<typeof ActivityFormSchema>;
type ActivityFormPayload = z.output<typeof ActivityFormSchema>;

export { type ActivityFormInput, type ActivityFormPayload, ActivityFormSchema };
