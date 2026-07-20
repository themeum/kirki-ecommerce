import { z } from 'zod';

import { optionalNullableString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

const ShippingRegionSchema = z.object({
  country: z.string(),
  states: z.array(z.union([z.string(), z.number()])),
  hasDeselectedState: z.boolean().optional(),
  flag: z.string().optional(),
});

export const ShippingRegionFormSchema = z.object({
  title: optionalNullableString(),
  countries: z.array(z.string()).min(1, {
    message: __('Select at least one country', 'kirki-ecommerce'),
  }),
  regions: z.array(ShippingRegionSchema).min(1, {
    message: __('Select at least one region', 'kirki-ecommerce'),
  }),
});

export type ShippingRegionFormValues = z.infer<typeof ShippingRegionFormSchema>;

export const shippingRegionDefaultValues: ShippingRegionFormValues = {
  title: '',
  countries: [],
  regions: [],
};
