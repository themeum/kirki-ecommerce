import { z } from 'zod';

const EmailNotificationSchema = z
  .object({
    name: z.string().optional(),
    is_enabled: z.boolean().optional(),
  })
  .passthrough();

const EmailGroupSchema = z.record(EmailNotificationSchema).optional();

const EmailRootSchema = z
  .object({
    order_notifications: EmailGroupSchema,
    user_notifications: EmailGroupSchema,
    inventory_notifications: EmailGroupSchema,
  })
  .passthrough()
  .optional();

export const EmailSettingsFormSchema = z
  .object({
    admin_emails: EmailRootSchema,
    customer_emails: EmailRootSchema,
    default_template: z.any().optional(),
  })
  .passthrough();

export type EmailSettingsFormValues = z.infer<typeof EmailSettingsFormSchema>;

export const emailSettingsDefaultValues: EmailSettingsFormValues = {
  admin_emails: {},
  customer_emails: {},
};
