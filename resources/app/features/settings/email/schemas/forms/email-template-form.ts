import type { z } from 'zod';

import { EmailTemplateShape } from '@/features/settings/email/schemas/catalog/email-template';
import { prepareFormSchema } from '@/libs/zod';

export const EmailTemplateFormSchema = prepareFormSchema(EmailTemplateShape).transform(
  (values) => ({
    logo: values.logo?.id ?? null,
    height: values.height ?? 50,
    position: values.position || 'center',
    colors: {
      background: {
        email_body: values.colors.background.email_body || '#FFFFFF',
        outer_area: values.colors.background.outer_area || '#DBDBE5',
        info_cads: values.colors.background.info_cads || '#F5F5F5',
        divider: values.colors.background.divider || '#E0E0E0',
      },
      typography: {
        headings: values.colors.typography.headings || '#000000',
        body: values.colors.typography.body || '#000000',
        muted: values.colors.typography.muted || '#474747',
        link: values.colors.typography.link || '#167BFF',
        exceptions: values.colors.typography.exceptions || '#0078CE',
      },
      button: {
        background: values.colors.button.background || '#167BFF',
        text: values.colors.button.text || '#FFFFFF',
      },
    },
    additional_description: values.additional_description || null,
    footer: values.footer || null,
  }),
);

export type EmailTemplateFormInput = z.input<typeof EmailTemplateFormSchema>;

export type EmailTemplateFormPayload = z.output<typeof EmailTemplateFormSchema>;
