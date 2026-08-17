import { z } from 'zod';

import { CurrencyDraftSchema } from '@/features/settings/multi-currency/schemas/catalog/currency';
import { prepareFormSchema } from '@/libs/zod';

const ExchangeRateFormShape = z.object({
  items: z.array(CurrencyDraftSchema),
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
