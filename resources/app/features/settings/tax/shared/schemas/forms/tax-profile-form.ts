import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const TaxProfileFormShape = z.object({
  name: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  is_default: z.boolean().default(false),
});

export const TaxProfileFormSchema = prepareFormSchema(TaxProfileFormShape).transform((values) => ({
  name: values.name,
  is_default: values.is_default,
}));

export type TaxProfileFormInput = z.input<typeof TaxProfileFormSchema>;

export type TaxProfileFormPayload = z.output<typeof TaxProfileFormSchema>;
