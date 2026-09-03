import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const TaxRegionStateFormShape = z.object({
  product_tax_rate: required(
    z.union([z.number(), z.string()]).default(0),
    __('This field is required', 'kirki-ecommerce'),
  ),
  shipping_tax_rate: required(
    z.union([z.number(), z.string()]).default(0),
    __('This field is required', 'kirki-ecommerce'),
  ),
});

export const TaxRegionStateFormSchema = prepareFormSchema(TaxRegionStateFormShape).transform(
  (values) => ({
    product_tax_rate: Number(values.product_tax_rate) || 0,
    shipping_tax_rate: Number(values.shipping_tax_rate) || 0,
  }),
);

export type TaxRegionStateFormInput = z.input<typeof TaxRegionStateFormSchema>;

export type TaxRegionStateFormPayload = z.output<typeof TaxRegionStateFormSchema>;
