import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';

/**
 * Each notification entry carries at least a name/enabled flag; the exact
 * extra fields vary per notification type (subject/heading/message/etc.),
 * so the leaf stays a passthrough rather than enumerating every variant.
 */
const EmailNotificationFormShape = z
  .object({
    name: z.string().nullish(),
    is_enabled: z.boolean().nullish(),
  })
  .passthrough();

const EmailGroupFormShape = z.record(EmailNotificationFormShape).nullish();

const EmailRootFormShape = z
  .object({
    order_notifications: EmailGroupFormShape,
    user_notifications: EmailGroupFormShape,
    inventory_notifications: EmailGroupFormShape,
  })
  .partial();

const EmailSettingsFormShape = z.object({
  admin_emails: EmailRootFormShape.default({}),
  customer_emails: EmailRootFormShape.default({}),
  /**
   * Owned by the separate branding editor (`edit-template.tsx`); this page
   * only toggles notifications, so `default_template` passes through
   * whatever was last saved rather than being edited here.
   */
  default_template: z.record(z.any()).nullish(),
});

export const EmailSettingsFormSchema = prepareFormSchema(EmailSettingsFormShape).transform((values) => ({
  admin_emails: values.admin_emails,
  customer_emails: values.customer_emails,
  default_template: values.default_template ?? null,
}));

export type EmailSettingsFormInput = z.input<typeof EmailSettingsFormSchema>;

export type EmailSettingsFormPayload = z.output<typeof EmailSettingsFormSchema>;
