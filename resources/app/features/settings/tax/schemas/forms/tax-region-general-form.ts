import { z } from 'zod';

import { TaxRateSchema } from '@/features/settings/tax/schemas/catalog/tax';
import { prepareFormSchema } from '@/libs/zod';

const TaxRegionGeneralFormShape = z.object({
  product_tax: z.array(TaxRateSchema).default([]),
  shipping_tax: z.array(TaxRateSchema).default([]),
  is_central_tax_enabled: z.boolean().default(false),
  central_product_tax: z.union([z.number(), z.string()]).default(0),
  central_shipping_tax: z.union([z.number(), z.string()]).default(0),
});

export const TaxRegionGeneralFormSchema = prepareFormSchema(TaxRegionGeneralFormShape).transform(
  (values) => ({
    product_tax: values.product_tax,
    shipping_tax: values.shipping_tax,
    is_central_tax_enabled: values.is_central_tax_enabled,
    central_product_tax: values.central_product_tax,
    central_shipping_tax: values.central_shipping_tax,
  }),
);

export type TaxRegionGeneralFormInput = z.input<typeof TaxRegionGeneralFormSchema>;

export type TaxRegionGeneralFormPayload = z.output<typeof TaxRegionGeneralFormSchema>;
