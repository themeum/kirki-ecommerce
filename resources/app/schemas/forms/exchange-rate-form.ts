import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { CurrencyDraftSchema } from '@/schemas/catalog/currency';

const ExchangeRateFormShape = z.object({
  items: z.array(CurrencyDraftSchema),
});

export const ExchangeRateFormSchema = prepareFormSchema(ExchangeRateFormShape).transform((values) => ({
  items: values.items,
}));

export type ExchangeRateFormInput = z.input<typeof ExchangeRateFormSchema>;

export type ExchangeRateFormPayload = z.output<typeof ExchangeRateFormSchema>;
