import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ManualPaymentFormShape = z.object({
  name: required(z.string().default(''), __('Method name is required', 'kirki-ecommerce')),
  icon: z
    .union([z.string(), z.object({ url: z.string().optional() }).passthrough(), z.null()])
    .nullish()
    .default(''),
  instructions: z.string().nullish().default(''),
  is_manual: z.boolean().default(true),
  is_enabled: z.boolean().default(true),
});

export const ManualPaymentFormSchema = prepareFormSchema(ManualPaymentFormShape).transform((values) => ({
  name: values.name,
  icon:
    typeof values.icon === 'object' && values.icon !== null
      ? (values.icon.url ?? '')
      : (values.icon ?? ''),
  instructions: values.instructions || null,
  is_manual: true,
  is_enabled: values.is_enabled,
}));

export type ManualPaymentFormInput = z.input<typeof ManualPaymentFormSchema>;

export type ManualPaymentFormPayload = z.output<typeof ManualPaymentFormSchema>;
