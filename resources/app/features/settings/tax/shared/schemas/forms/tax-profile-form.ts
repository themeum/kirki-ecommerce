import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const TaxProfileFormShape = z.object({
  name: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
});

export const TaxProfileFormSchema = prepareFormSchema(TaxProfileFormShape).transform((values) => ({
  name: values.name,
}));

export type TaxProfileFormInput = z.input<typeof TaxProfileFormSchema>;

export type TaxProfileFormPayload = z.output<typeof TaxProfileFormSchema>;
