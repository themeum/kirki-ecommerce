import { z } from 'zod';

import { CurrencyDraftSchema } from '@/features/settings/multi-currency/schemas/catalog/currency';
import { prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

const AddCurrencyPopupFormShape = z.object({
  selectedCurrencies: z
    .array(CurrencyDraftSchema)
    .min(1, __('Select at least one currency', 'kirki-ecommerce')),
});

export const AddCurrencyPopupFormSchema = prepareFormSchema(AddCurrencyPopupFormShape).transform((values) => ({
  selectedCurrencies: values.selectedCurrencies,
}));

export type AddCurrencyPopupFormInput = z.input<typeof AddCurrencyPopupFormSchema>;

export type AddCurrencyPopupFormPayload = z.output<typeof AddCurrencyPopupFormSchema>;
