import { z } from 'zod';

import { TaxRateSchema } from '@/schemas/forms/tax-settings-form';

export const TaxRegionGeneralFormSchema = z
  .object({
    product_tax: z.array(TaxRateSchema).optional(),
    is_central_tax_enabled: z.boolean().optional(),
    central_product_tax: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

export type TaxRegionGeneralFormValues = z.infer<
  typeof TaxRegionGeneralFormSchema
>;

export const taxRegionGeneralDefaultValues: TaxRegionGeneralFormValues = {
  product_tax: [],
  is_central_tax_enabled: false,
  central_product_tax: 0,
};
