import { z } from 'zod';

export const AddCurrencyPopupFormSchema = z.object({
  selectedCurrencies: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        code: z.string(),
        symbol: z.string().optional(),
        exchange_rate: z.union([z.string(), z.number()]).optional(),
        is_base: z.boolean().optional(),
        is_active: z.boolean().optional(),
      }),
    )
    .min(1),
});

export type AddCurrencyPopupFormValues = z.infer<
  typeof AddCurrencyPopupFormSchema
>;
