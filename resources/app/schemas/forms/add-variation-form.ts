import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const AddVariationFormShape = z.object({
  name: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  type: z.string().nullish(),
});

export const AddVariationFormSchema = prepareFormSchema(AddVariationFormShape).transform((values) => ({
  name: values.name,
  type: values.type || null,
}));

export type AddVariationFormInput = z.input<typeof AddVariationFormSchema>;

export type AddVariationFormPayload = z.output<typeof AddVariationFormSchema>;
