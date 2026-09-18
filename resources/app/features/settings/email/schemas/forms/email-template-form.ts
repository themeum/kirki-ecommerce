import type { z } from 'zod';

import {
  EMAIL_DEFAULT_TEMPLATE,
  EmailDefaultTemplateShape,
} from '@/features/settings/email/schemas/catalog/email-template';
import { prepareFormSchema } from '@/libs/zod';

export const EmailTemplateFormSchema = prepareFormSchema(EmailDefaultTemplateShape).transform(
  (values) => ({
    logo: values.logo?.id ?? null,
    height: values.height ?? 50,
    position: values.position || 'center',
    colors: {
      background: {
        email_body:
          values.colors.background.email_body || EMAIL_DEFAULT_TEMPLATE.background.email_body,
        outer_area:
          values.colors.background.outer_area || EMAIL_DEFAULT_TEMPLATE.background.outer_area,
        info_cads:
          values.colors.background.info_cads || EMAIL_DEFAULT_TEMPLATE.background.info_cads,
        divider: values.colors.background.divider || EMAIL_DEFAULT_TEMPLATE.background.divider,
      },
      typography: {
        headings: values.colors.typography.headings || EMAIL_DEFAULT_TEMPLATE.typography.headings,
        body: values.colors.typography.body || EMAIL_DEFAULT_TEMPLATE.typography.body,
        muted: values.colors.typography.muted || EMAIL_DEFAULT_TEMPLATE.typography.muted,
        link: values.colors.typography.link || EMAIL_DEFAULT_TEMPLATE.typography.link,
        exceptions:
          values.colors.typography.exceptions || EMAIL_DEFAULT_TEMPLATE.typography.exceptions,
      },
      button: {
        background: values.colors.button.background || EMAIL_DEFAULT_TEMPLATE.button.background,
        text: values.colors.button.text || EMAIL_DEFAULT_TEMPLATE.button.text,
      },
    },
    additional_description: values.additional_description || null,
    footer: values.footer || null,
  }),
);

export type EmailTemplateFormInput = z.input<typeof EmailTemplateFormSchema>;

export type EmailTemplateFormPayload = z.output<typeof EmailTemplateFormSchema>;
