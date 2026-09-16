import { z } from 'zod';

import { MailConfigurationShape } from '@/features/settings/email/schemas/forms/mail-configuration-form';
import { prepareFormSchema } from '@/libs/zod';

/**
 * The list/toggle page only reads/writes `is_enabled` here — the record
 * also carries `subject`/`heading`/`message` (see `EmailNotificationSchema`
 * in `schemas/catalog/settings.ts`), edited separately in the per-notification
 * editor, so this leaf stays a passthrough rather than enumerating them.
 * There is no `name` field; row labels come from the client-side
 * notification dictionary (`lib/utils.ts`).
 */
const EmailNotificationFormShape = z
  .object({
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
  mail_configuration: MailConfigurationShape.nullish(),
  default_template: z.record(z.any()).nullish(),
});

export const EmailSettingsFormSchema = prepareFormSchema(EmailSettingsFormShape).transform((values) => ({
  admin_emails: values.admin_emails,
  customer_emails: values.customer_emails,
  mail_configuration: values.mail_configuration ?? null,
  default_template: values.default_template ?? null,
}));

export type EmailSettingsFormInput = z.input<typeof EmailSettingsFormSchema>;

export type EmailSettingsFormPayload = z.output<typeof EmailSettingsFormSchema>;
