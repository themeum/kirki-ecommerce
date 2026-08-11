import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

const CityRefSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().optional(),
  name: z.string().optional(),
  flag: z.string().optional(),
  code: z.string().optional(),
});

const AddCitiesPopupFormShape = z.object({
  selectedCities: z
    .array(CityRefSchema)
    .min(1, __('Select at least one city', 'kirki-ecommerce')),
});

export const AddCitiesPopupFormSchema = prepareFormSchema(AddCitiesPopupFormShape).transform((values) => ({
  selectedCities: values.selectedCities,
}));

export type AddCitiesPopupFormInput = z.input<typeof AddCitiesPopupFormSchema>;

export type AddCitiesPopupFormPayload = z.output<typeof AddCitiesPopupFormSchema>;
