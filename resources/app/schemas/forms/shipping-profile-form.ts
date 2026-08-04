import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ShippingProfileFormShape = z.object({
  name: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
});

export const ShippingProfileFormSchema = prepareFormSchema(ShippingProfileFormShape).transform((values) => ({
  name: values.name,
}));

export type ShippingProfileFormInput = z.input<typeof ShippingProfileFormSchema>;

export type ShippingProfileFormPayload = z.output<typeof ShippingProfileFormSchema>;
