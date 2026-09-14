import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { MediaRefSchema } from '@/schemas/shared/media';

export const EmailTemplateColorsSchema = z.object({
  background: z.string().nullish(),
  text: z.string().nullish(),
  link: z.string().nullish(),
  label: z.string().nullish(),
  button: z.string().nullish(),
  button_bg: z.string().nullish(),
});


const EmailTemplateFormShape = z.object({
  logo: MediaRefSchema
    .nullish(),
  height: z.coerce.number().nullish().default(50),
  position: z.string().nullish().default('start'),
  colors: EmailTemplateColorsSchema.default({}),
});

export const EmailTemplateFormSchema = prepareFormSchema(EmailTemplateFormShape).transform((values) => ({
  logo: values.logo?.id ?? null,
  height: values.height ?? 50,
  position: values.position || 'center',
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
