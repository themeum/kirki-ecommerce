import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

const CurrencyRefSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  code: z.string(),
  symbol: z.string().optional(),
  exchange_rate: z.union([z.string(), z.number()]).optional(),
  is_base: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

const AddCurrencyPopupFormShape = z.object({
  selectedCurrencies: z
    .array(CurrencyRefSchema)
    .min(1, __('Select at least one currency', 'kirki-ecommerce')),
});

export const AddCurrencyPopupFormSchema = prepareFormSchema(AddCurrencyPopupFormShape).transform((values) => ({
  selectedCurrencies: values.selectedCurrencies,
}));

export type AddCurrencyPopupFormInput = z.input<typeof AddCurrencyPopupFormSchema>;

export type AddCurrencyPopupFormPayload = z.output<typeof AddCurrencyPopupFormSchema>;
