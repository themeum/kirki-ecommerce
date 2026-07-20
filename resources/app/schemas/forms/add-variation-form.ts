import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const AddVariationFormSchema = z.object({
  name: requiredString(__('Title is required', 'kirki-ecommerce')),
});

export type AddVariationFormValues = z.infer<typeof AddVariationFormSchema>;
