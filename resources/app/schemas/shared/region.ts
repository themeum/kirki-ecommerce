import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

export const RegionSchema = z.object({
  country: z.string(),
  states: z.array(z.union([z.string(), z.number()])),
  hasDeselectedState: z.boolean().optional(),
  flag: z.string().optional(),
});

export type Region = z.infer<typeof RegionSchema>;

const RegionsDialogFormShape = z.object({
  title: z.string().nullish().default(''),
  countries: z.array(z.string()).min(1, {
    message: __('Select at least one country', 'kirki-ecommerce'),
  }),
  regions: z.array(RegionSchema).min(1, {
    message: __('Select at least one region', 'kirki-ecommerce'),
  }),
});

export const RegionsDialogFormSchema = prepareFormSchema(RegionsDialogFormShape).transform((values) => ({
  title: values.title || null,
  countries: values.countries,
  regions: values.regions,
}));

export type RegionsDialogFormInput = z.input<typeof RegionsDialogFormSchema>;

export type RegionsDialogFormPayload = z.output<typeof RegionsDialogFormSchema>;
