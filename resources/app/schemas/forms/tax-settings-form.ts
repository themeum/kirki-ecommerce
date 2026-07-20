import { z } from 'zod';

export const TaxRateSchema = z
  .object({
    state: z.string(),
    rate: z.union([z.number(), z.string()]),
    flag: z.string().optional(),
  })
  .passthrough();

export const TaxSettingsFormSchema = z
  .object({
    is_tax_inclusive_price: z.boolean().optional(),
    is_enabled_taxed_price: z.boolean().optional(),
    is_shipping_tax_enabled: z.boolean().optional(),
    tax_regions: z.array(z.record(z.any())).optional(),
    tax_services: z.array(z.any()).optional(),
    tax_ids: z.array(z.any()).optional(),
  })
  .passthrough();

export type TaxSettingsFormValues = z.infer<typeof TaxSettingsFormSchema>;

export const taxSettingsDefaultValues: TaxSettingsFormValues = {
  is_tax_inclusive_price: false,
  is_enabled_taxed_price: false,
  is_shipping_tax_enabled: false,
  tax_regions: [],
  tax_services: [],
  tax_ids: [],
};
