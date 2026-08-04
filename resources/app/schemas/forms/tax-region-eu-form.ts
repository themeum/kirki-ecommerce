import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';
import { TaxRateSchema } from '@/schemas/forms/tax-settings-form';

const TaxRegionEuFormShape = z.object({
  type: z.string().nullish().default('oss'),
  product_tax: z.array(TaxRateSchema).default([]),
});

export const TaxRegionEuFormSchema = prepareFormSchema(TaxRegionEuFormShape).transform((values) => ({
  type: values.type || 'oss',
  product_tax: values.product_tax,
}));

export type TaxRegionEuFormInput = z.input<typeof TaxRegionEuFormSchema>;

export type TaxRegionEuFormPayload = z.output<typeof TaxRegionEuFormSchema>;
