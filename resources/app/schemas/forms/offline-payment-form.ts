import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const OfflinePaymentFormShape = z.object({
  name: required(z.string().default(''), __('Method name is required', 'kirki-ecommerce')),
  icon: z
    .union([z.string(), z.object({ url: z.string().optional() }).passthrough(), z.null()])
    .nullish()
    .default(''),
  instructions: z.string().nullish().default(''),
  is_offline: z.boolean().default(true),
  is_enabled: z.boolean().default(true),
});

export const OfflinePaymentFormSchema = prepareFormSchema(OfflinePaymentFormShape).transform((values) => ({
  name: values.name,
  icon:
    typeof values.icon === 'object' && values.icon !== null
      ? (values.icon.url ?? '')
      : (values.icon ?? ''),
  instructions: values.instructions || null,
  is_offline: true,
  is_enabled: values.is_enabled,
}));

export type OfflinePaymentFormInput = z.input<typeof OfflinePaymentFormSchema>;

export type OfflinePaymentFormPayload = z.output<typeof OfflinePaymentFormSchema>;
