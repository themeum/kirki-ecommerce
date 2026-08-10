import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { ShippingRegionFormShape } from '@/schemas/forms/shipping-region-form';
import { __ } from '@/wpi18n';

const ShippingZoneFormShape = z.object({
  title: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  regions: z.array(ShippingRegionFormShape).min(1, {
    message: __('Select at least one destination', 'kirki-ecommerce'),
  }),
});

export const ShippingZoneFormSchema = prepareFormSchema(ShippingZoneFormShape).transform((values) => ({
  title: values.title,
  regions: values.regions,
}));

export type ShippingZoneFormInput = z.input<typeof ShippingZoneFormSchema>;

export type ShippingZoneFormPayload = z.output<typeof ShippingZoneFormSchema>;
