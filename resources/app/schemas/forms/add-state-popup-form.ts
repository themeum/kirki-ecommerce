import { z } from 'zod';

export const AddStatePopupFormSchema = z.object({
  selectedCountries: z.array(z.union([z.string(), z.number()])),
});

export type AddStatePopupFormValues = z.infer<typeof AddStatePopupFormSchema>;
