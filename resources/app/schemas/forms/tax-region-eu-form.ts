import { z } from 'zod';

import { TaxRateSchema } from '@/schemas/forms/tax-settings-form';

export const TaxRegionEuFormSchema = z
  .object({
    type: z.string().optional(),
    product_tax: z.array(TaxRateSchema).optional(),
  })
  .passthrough();

export type TaxRegionEuFormValues = z.infer<typeof TaxRegionEuFormSchema>;

export const taxRegionEuDefaultValues: TaxRegionEuFormValues = {
  type: 'oss',
  product_tax: [],
};
