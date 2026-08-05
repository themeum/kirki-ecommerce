import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';

export const EmailTemplateColorsSchema = z.object({
  background: z.string().nullish().default(''),
  text: z.string().nullish().default(''),
  link: z.string().nullish().default(''),
  label: z.string().nullish().default(''),
  button: z.string().nullish().default(''),
  button_bg: z.string().nullish().default(''),
});

type LogoValue = string | { id?: string | number; url?: string } | null | undefined;

const resolveLogoUrl = (logo: LogoValue): string => {
  if (!logo) {
    return '';
  }
  if (typeof logo === 'string') {
    return logo;
  }
  return String(logo.url ?? '');
};

const EmailTemplateFormShape = z.object({
  logo: z
    .union([z.string(), z.object({ id: z.union([z.string(), z.number()]).optional(), url: z.string().optional() }).passthrough(), z.null()])
    .nullish()
    .default(''),
  height: z.coerce.number().nullish().default(50),
  position: z.string().nullish().default('start'),
  colors: EmailTemplateColorsSchema.default({}),
});

export const EmailTemplateFormSchema = prepareFormSchema(EmailTemplateFormShape).transform((values) => ({
  logo: resolveLogoUrl(values.logo),
  height: `${values.height ?? 50}px`,
  position: values.position || 'start',
  colors: {
    background: values.colors.background || null,
    text: values.colors.text || null,
    link: values.colors.link || null,
    label: values.colors.label || null,
    button: values.colors.button || null,
    button_bg: values.colors.button_bg || null,
  },
}));

export type EmailTemplateFormInput = z.input<typeof EmailTemplateFormSchema>;

export type EmailTemplateFormPayload = z.output<typeof EmailTemplateFormSchema>;
