import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const ShippingProfileFormSchema = z.object({
  name: requiredString(__('Title is required', 'kirki-ecommerce')),
});

export type ShippingProfileFormValues = z.infer<
  typeof ShippingProfileFormSchema
>;

export const shippingProfileDefaultValues: ShippingProfileFormValues = {
  name: '',
};
