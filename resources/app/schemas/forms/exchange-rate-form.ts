import { z } from 'zod';

export const ExchangeRateFormSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string(),
      code: z.string(),
      symbol: z.string().optional(),
      exchange_rate: z.union([z.string(), z.number()]).optional().nullable(),
      is_base: z.boolean().optional(),
      is_active: z.boolean().optional(),
    }),
  ),
});

export type ExchangeRateFormValues = z.infer<typeof ExchangeRateFormSchema>;
