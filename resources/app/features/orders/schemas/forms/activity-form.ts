import z from 'zod';

import { required } from '@/libs/zod';

const ActivityFormSchema = z.object({
  message: required(z.string().nullish(), 'Message is required'),
});

type ActivityFormInput = z.input<typeof ActivityFormSchema>;
type ActivityFormPayload = z.output<typeof ActivityFormSchema>;

export { type ActivityFormInput, type ActivityFormPayload, ActivityFormSchema };
