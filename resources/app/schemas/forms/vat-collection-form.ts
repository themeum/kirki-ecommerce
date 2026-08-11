import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const VatCollectionFormShape = z.object({
  state: required(z.string().default(''), __('Country is required', 'kirki-ecommerce')),
  rate: required(
    z.union([z.string(), z.number()]).default(''),
    __('VAT rate is required', 'kirki-ecommerce'),
  ),
  flag: z.string().nullish(),
});

export const VatCollectionFormSchema = prepareFormSchema(VatCollectionFormShape).transform((values) => ({
  state: values.state,
  rate: values.rate,
  flag: values.flag || undefined,
}));

export type VatCollectionFormInput = z.input<typeof VatCollectionFormSchema>;

export type VatCollectionFormPayload = z.output<typeof VatCollectionFormSchema>;
