import { z } from 'zod';

import { requiredString } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const VatCollectionFormSchema = z.object({
  state: requiredString(__('Country is required', 'kirki-ecommerce')),
  rate: z.union([
    z.string().min(1, __('VAT rate is required', 'kirki-ecommerce')),
    z.number(),
  ]),
  flag: z.string().optional(),
});

export type VatCollectionFormValues = z.infer<typeof VatCollectionFormSchema>;
