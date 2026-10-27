import type { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { EmailNotificationSchema } from '@/schemas/catalog/settings';

const EmailNotificationTemplateFormShape = EmailNotificationSchema.pick({
  subject: true,
  heading: true,
  message: true,
});

export const EmailNotificationTemplateFormSchema = prepareFormSchema(
  EmailNotificationTemplateFormShape,
).transform((values) => ({
  subject: values.subject || '',
  heading: values.heading || '',
  message: values.message || '',
}));

export type EmailNotificationTemplateFormInput = z.input<typeof EmailNotificationTemplateFormSchema>;

export type EmailNotificationTemplateFormPayload = z.output<typeof EmailNotificationTemplateFormSchema>;
