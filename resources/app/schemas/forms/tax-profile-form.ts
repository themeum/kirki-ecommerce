import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const TaxProfileFormSchema = z.object({
  name: requiredString(__('Title is required', 'kirki-ecommerce')),
});

export type TaxProfileFormValues = z.infer<typeof TaxProfileFormSchema>;
