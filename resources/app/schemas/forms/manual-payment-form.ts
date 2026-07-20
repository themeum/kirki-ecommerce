import { z } from 'zod';

import {
  optionalNullableString,
  requiredString,
} from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

export const ManualPaymentFormSchema = z.object({
  name: requiredString(__('Method name is required', 'kirki-ecommerce')),
  icon: z
    .union([
      z.string(),
      z.object({ url: z.string().optional() }).passthrough(),
      z.null(),
    ])
    .optional()
    .nullable(),
  instructions: optionalNullableString(),
  is_manual: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
});

export type ManualPaymentFormValues = z.infer<typeof ManualPaymentFormSchema>;

export const manualPaymentDefaultValues: ManualPaymentFormValues = {
  name: '',
  icon: '',
  instructions: '',
  is_manual: true,
  is_enabled: true,
};
