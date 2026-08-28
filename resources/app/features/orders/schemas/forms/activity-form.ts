import { required } from '@/libs/zod';
import z from 'zod';

const ActivityFormSchema = z.object({
  message: required(z.string().nullish(), 'Message is required'),
});

type ActivityFormInput = z.input<typeof ActivityFormSchema>;
type ActivityFormPayload = z.output<typeof ActivityFormSchema>;

export { ActivityFormSchema, type ActivityFormInput, type ActivityFormPayload };
