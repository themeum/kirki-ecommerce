import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const ProductAdditionalInfoFormSchema = z.object({
  title: requiredString(__('Title is required', 'kirki-ecommerce')),
  description: requiredString(__('Description is required', 'kirki-ecommerce')),
});

export type ProductAdditionalInfoFormValues = z.infer<
  typeof ProductAdditionalInfoFormSchema
>;
