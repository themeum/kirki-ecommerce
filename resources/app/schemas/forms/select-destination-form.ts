import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const SelectDestinationFormSchema = z.object({
  country: requiredString(__('Country is required', 'kirki-ecommerce')),
  states: z.array(z.union([z.string(), z.number()])),
});

export type SelectDestinationFormValues = z.infer<
  typeof SelectDestinationFormSchema
>;

export const selectDestinationDefaultValues: SelectDestinationFormValues = {
  country: '',
  states: [],
};
