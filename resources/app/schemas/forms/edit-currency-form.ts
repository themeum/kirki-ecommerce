import { z } from 'zod';

import { __ } from '@/wpi18n';

export const EditCurrencyFormSchema = z.object({
  exchange_rate: z.union([
    z.string().min(1, __('Exchange rate is required', 'kirki-ecommerce')),
    z.number(),
  ]),
});

export type EditCurrencyFormValues = z.infer<typeof EditCurrencyFormSchema>;
