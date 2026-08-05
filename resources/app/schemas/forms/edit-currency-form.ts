import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const EditCurrencyFormShape = z.object({
  exchange_rate: required(
    z.union([z.string(), z.number()]).default(''),
    __('Exchange rate is required', 'kirki-ecommerce'),
  ),
});

export const EditCurrencyFormSchema = prepareFormSchema(EditCurrencyFormShape).transform((values) => ({
  exchange_rate: values.exchange_rate,
}));

export type EditCurrencyFormInput = z.input<typeof EditCurrencyFormSchema>;

export type EditCurrencyFormPayload = z.output<typeof EditCurrencyFormSchema>;
