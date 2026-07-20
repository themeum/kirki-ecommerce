import { z } from 'zod';

export const EmailTemplateColorsSchema = z
  .object({
    background: z.string().optional(),
    text: z.string().optional(),
    link: z.string().optional(),
    label: z.string().optional(),
    button: z.string().optional(),
    button_bg: z.string().optional(),
  })
  .passthrough();

export const EmailTemplateFormSchema = z
  .object({
    logo: z
      .union([
        z.string(),
        z
          .object({
            id: z.union([z.string(), z.number()]).optional(),
            url: z.string().optional(),
          })
          .passthrough(),
        z.null(),
      ])
      .optional(),
    height: z.coerce.number().optional(),
    position: z.string().optional(),
    colors: EmailTemplateColorsSchema.optional(),
  })
  .passthrough();

export type EmailTemplateFormValues = z.infer<typeof EmailTemplateFormSchema>;

export const emailTemplateDefaultValues: EmailTemplateFormValues = {
  logo: '',
  height: 50,
  position: 'start',
  colors: {
    background: '',
    text: '',
    link: '',
    label: '',
    button: '',
    button_bg: '',
  },
};
