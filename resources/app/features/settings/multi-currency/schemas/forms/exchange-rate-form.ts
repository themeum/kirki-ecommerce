import { z } from 'zod';

import { CurrencyDraftSchema } from '@/features/settings/multi-currency/schemas/catalog/currency';
import { prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

const ExchangeRateFormShape = z.object({
  items: z.array(
    CurrencyDraftSchema.extend({
      exchange_rate: z
        .union([z.string(), z.number()])
        .nullish()
        .refine(
          (value) => value != null && value !== '' && Number(value) > 0,
          __('Exchange rate must be greater than 0', 'kirki-ecommerce'),
        ),
    }),
  ),
});

export const ExchangeRateFormSchema = prepareFormSchema(ExchangeRateFormShape).transform((values) => ({
  items: values.items.map(item => ({
    ...item,
    is_base: item.is_base ?? false,
    is_active: item.is_active ?? true,
  })),
}));

export type ExchangeRateFormInput = z.input<typeof ExchangeRateFormSchema>;

export type ExchangeRateFormPayload = z.output<typeof ExchangeRateFormSchema>;
