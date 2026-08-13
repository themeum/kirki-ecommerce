import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const SelectDestinationFormShape = z.object({
  country: required(z.string().default(''), __('Country is required', 'kirki-ecommerce')),
  states: z.array(z.union([z.string(), z.number()])).default([]),
});

export const SelectDestinationFormSchema = prepareFormSchema(SelectDestinationFormShape).transform((values) => ({
  country: values.country,
  states: values.states,
}));

export type SelectDestinationFormInput = z.input<typeof SelectDestinationFormSchema>;

export type SelectDestinationFormPayload = z.output<typeof SelectDestinationFormSchema>;
