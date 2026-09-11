import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ShippingProfileFormShape = z.object({
  name: required(z.string().default(''), __('Title is required', 'kirki-ecommerce')),
  is_default: z.boolean().default(false),
});

export const ShippingProfileFormSchema = prepareFormSchema(ShippingProfileFormShape).transform((values) => ({
  name: values.name,
  is_default: values.is_default,
}));

export type ShippingProfileFormInput = z.input<typeof ShippingProfileFormSchema>;

export type ShippingProfileFormPayload = z.output<typeof ShippingProfileFormSchema>;
