import { z } from 'zod';

import { TaxRegionSchema } from '@/features/settings/tax/schemas/catalog/tax';
import { prepareFormSchema } from '@/libs/zod';

const TaxRegionStateShape = z
  .object({
    id: z.union([z.string(), z.number()]),
    title: z.string().optional(),
    name: z.string().optional(),
    flag: z.string().optional(),
    code: z.string().optional(),
  })
  .passthrough();

/**
 * The form-side view of a tax region: the response shape
 * ({@link TaxRegionSchema}) plus the fields the region cards and Group 5
 * sub-dialogs manage locally (`is_enabled`, `states`, per-region central
 * tax). Every level stays `.passthrough()`, so the deeper rule/condition
 * structures those dialogs own ride through untouched and the schema stays
 * `.extend()`-able for fields added later.
 */
const TaxRegionFormShape = TaxRegionSchema.extend({
  is_enabled: z.boolean().optional(),
  states: z.array(TaxRegionStateShape).optional(),
  flag: z.string().optional(),
  central_product_tax: z.union([z.number(), z.string()]).optional(),
  central_shipping_tax: z.union([z.number(), z.string()]).optional(),
  is_central_tax_enabled: z.boolean().optional(),
});

export type TaxRegionForm = z.infer<typeof TaxRegionFormShape>;
export type TaxRegionStateForm = z.infer<typeof TaxRegionStateShape>;

const TaxSettingsFormShape = z.object({
  is_tax_inclusive_price: z.boolean().default(false),
  is_enabled_taxed_price: z.boolean().default(false),
  is_shipping_tax_enabled: z.boolean().default(false),
  tax_regions: z.array(TaxRegionFormShape).default([]),
  tax_services: z.array(z.any()).default([]),
  tax_ids: z.array(z.any()).default([]),
});

export const TaxSettingsFormSchema = prepareFormSchema(TaxSettingsFormShape).transform((values) => ({
  is_tax_inclusive_price: values.is_tax_inclusive_price,
  is_enabled_taxed_price: values.is_enabled_taxed_price,
  is_shipping_tax_enabled: values.is_shipping_tax_enabled,
  tax_regions: values.tax_regions,
  tax_services: values.tax_services,
  tax_ids: values.tax_ids,
}));

export type TaxSettingsFormInput = z.input<typeof TaxSettingsFormSchema>;

export type TaxSettingsFormPayload = z.output<typeof TaxSettingsFormSchema>;
