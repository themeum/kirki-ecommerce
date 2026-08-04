import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';

const ExchangeRateItemSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  code: z.string(),
  symbol: z.string().optional(),
  exchange_rate: z.union([z.string(), z.number()]).nullish(),
  is_base: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

const ExchangeRateFormShape = z.object({
  items: z.array(ExchangeRateItemSchema),
});

export const ExchangeRateFormSchema = prepareFormSchema(ExchangeRateFormShape).transform((values) => ({
  items: values.items,
}));

export type ExchangeRateFormInput = z.input<typeof ExchangeRateFormSchema>;

export type ExchangeRateFormPayload = z.output<typeof ExchangeRateFormSchema>;
