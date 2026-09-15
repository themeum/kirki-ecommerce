import z from 'zod';

import { MediaRefSchema } from '@/schemas/shared/media';

export const EmailTemplateBackgroundColorsSchema = z.object({
  email_body: z.string().default('#FFFFFF'),
  outer_area: z.string().default('#DBDBE5'),
  info_cards: z.string().default('#F5F5F5'),
  divider: z.string().default('#E0E0E0'),
});

export const EmailTemplateTypographyColorsSchema = z.object({
  headings: z.string().default('#000000'),
  body: z.string().default('#000000'),
  muted: z.string().default('#474747'),
  link: z.string().default('#167BFF'),
  exceptions: z.string().default('#0078CE'),
});

export const EmailTemplateButtonColorsSchema = z.object({
  background: z.string().default('#167BFF'),
  text: z.string().default('#FFFFFF'),
});

export const EmailTemplateColorsSchema = z.object({
  background: EmailTemplateBackgroundColorsSchema,
  typography: EmailTemplateTypographyColorsSchema,
  button: EmailTemplateButtonColorsSchema,
});

export const EmailTemplateShape = z.object({
  logo: MediaRefSchema.nullish(),
  height: z.coerce.number().nullish().default(50),
  position: z.string().nullish().default('start'),
  colors: EmailTemplateColorsSchema,
  additional_description: z.string().nullish(),
  footer: z.string().nullish(),
});
