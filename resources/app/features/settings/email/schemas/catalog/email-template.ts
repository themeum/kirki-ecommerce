import z from 'zod';

import { MediaRefSchema } from '@/schemas/shared/media';

export const EMAIL_DEFAULT_TEMPLATE = {
  logo: null,
  background: {
    email_body: '#FFFFFF',
    outer_area: '#DBDBE5',
    info_cads: '#F5F5F5',
    divider: '#E0E0E0',
  },
  typography: {
    headings: '#000000',
    body: '#000000',
    muted: '#474747',
    link: '#167BFF',
    exceptions: '#0078CE',
  },
  button: {
    background: '#167BFF',
    text: '#FFFFFF',
  },
};

export const EmailTemplateBackgroundColorsSchema = z.object({
  email_body: z.string().default(EMAIL_DEFAULT_TEMPLATE.background.email_body),
  outer_area: z.string().default(EMAIL_DEFAULT_TEMPLATE.background.outer_area),
  info_cads: z.string().default(EMAIL_DEFAULT_TEMPLATE.background.info_cads),
  divider: z.string().default(EMAIL_DEFAULT_TEMPLATE.background.divider),
});

export const EmailTemplateTypographyColorsSchema = z.object({
  headings: z.string().default(EMAIL_DEFAULT_TEMPLATE.typography.headings),
  body: z.string().default(EMAIL_DEFAULT_TEMPLATE.typography.body),
  muted: z.string().default(EMAIL_DEFAULT_TEMPLATE.typography.muted),
  link: z.string().default(EMAIL_DEFAULT_TEMPLATE.typography.link),
  exceptions: z.string().default(EMAIL_DEFAULT_TEMPLATE.typography.exceptions),
});

export const EmailTemplateButtonColorsSchema = z.object({
  background: z.string().default(EMAIL_DEFAULT_TEMPLATE.button.background),
  text: z.string().default(EMAIL_DEFAULT_TEMPLATE.button.text),
});

export const EmailTemplateColorsSchema = z.object({
  background: EmailTemplateBackgroundColorsSchema,
  typography: EmailTemplateTypographyColorsSchema,
  button: EmailTemplateButtonColorsSchema,
});

export const EmailDefaultTemplateShape = z.object({
  logo: MediaRefSchema.nullish(),
  height: z.coerce.number().nullish().default(50),
  position: z.enum(['start', 'center', 'end']).nullish().default('center'),
  colors: EmailTemplateColorsSchema,
  additional_description: z.string().nullish(),
  footer: z.string().nullish(),
});

export type EmailDefaultTemplate = z.infer<typeof EmailDefaultTemplateShape>;
