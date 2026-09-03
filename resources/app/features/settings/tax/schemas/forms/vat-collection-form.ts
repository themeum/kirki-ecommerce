import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const VatCollectionFormShape = z.object({
  code: required(z.string().default(''), __('Country is required', 'kirki-ecommerce')),
  name: z.string().nullish(),
  flag: z.string().nullish(),
  rate: required(
    z.union([z.string(), z.number()]).default(''),
    __('VAT rate is required', 'kirki-ecommerce'),
  ),
});

export const VatCollectionFormSchema = prepareFormSchema(VatCollectionFormShape).transform(
  (values) => ({
    code: values.code,
    name: values.name || undefined,
    flag: values.flag || undefined,
    rate: Number(values.rate) || 0,
  }),
);

export type VatCollectionFormInput = z.input<typeof VatCollectionFormSchema>;

export type VatCollectionFormPayload = z.output<typeof VatCollectionFormSchema>;
