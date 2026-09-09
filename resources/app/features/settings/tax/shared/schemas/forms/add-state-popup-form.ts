import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';

const AddStatePopupFormShape = z.object({
  selectedCountries: z.array(z.union([z.string(), z.number()])),
});

export const AddStatePopupFormSchema = prepareFormSchema(AddStatePopupFormShape).transform((values) => ({
  selectedCountries: values.selectedCountries,
}));

export type AddStatePopupFormInput = z.input<typeof AddStatePopupFormSchema>;

export type AddStatePopupFormPayload = z.output<typeof AddStatePopupFormSchema>;
