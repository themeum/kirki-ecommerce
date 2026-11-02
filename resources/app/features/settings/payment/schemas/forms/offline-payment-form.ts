import { z } from 'zod';

import { mediaId, prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const OfflinePaymentFormShape = z.object({
  name: required(z.string().default(''), __('Method name is required', 'kirki-ecommerce')),
  icon: mediaId(),
  instructions: z.string().nullish().default(''),
  is_offline: z.boolean().default(true),
  is_enabled: z.boolean().default(true),
});

export const OfflinePaymentFormSchema = prepareFormSchema(OfflinePaymentFormShape).transform((values) => ({
  name: values.name,
  icon: values.icon,
  instructions: values.instructions || null,
  is_offline: true,
  is_enabled: values.is_enabled,
}));

export type OfflinePaymentFormInput = z.input<typeof OfflinePaymentFormSchema>;

export type OfflinePaymentFormPayload = z.output<typeof OfflinePaymentFormSchema>;
