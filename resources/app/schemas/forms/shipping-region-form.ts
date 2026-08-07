import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

export const ShippingRegionFormShape = z.object({
  country: z.string(),
  states: z.array(z.union([z.string(), z.number()])),
  hasDeselectedState: z.boolean().optional(),
  flag: z.string().optional(),
});

const ShippingRegionFormMainShape = z.object({
  title: z.string().nullish().default(''),
  countries: z.array(z.string()).min(1, {
    message: __('Select at least one country', 'kirki-ecommerce'),
  }),
  regions: z.array(ShippingRegionFormShape).min(1, {
    message: __('Select at least one region', 'kirki-ecommerce'),
  }),
});

export const ShippingRegionFormSchema = prepareFormSchema(ShippingRegionFormMainShape).transform((values) => ({
  title: values.title || null,
  countries: values.countries,
  regions: values.regions,
}));

export type ShippingRegionFormInput = z.input<typeof ShippingRegionFormSchema>;

export type ShippingRegionFormPayload = z.output<typeof ShippingRegionFormSchema>;
