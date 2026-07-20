import { z } from 'zod';

export const AddCitiesPopupFormSchema = z.object({
  selectedCities: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        title: z.string().optional(),
        name: z.string().optional(),
        flag: z.string().optional(),
        code: z.string().optional(),
      }),
    )
    .min(1),
});

export type AddCitiesPopupFormValues = z.infer<typeof AddCitiesPopupFormSchema>;
