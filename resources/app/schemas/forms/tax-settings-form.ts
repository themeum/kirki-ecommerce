import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';

export const TaxRateSchema = z
  .object({
    state: z.string(),
    rate: z.union([z.number(), z.string()]),
    flag: z.string().optional(),
  })
  .passthrough();

/**
 * A tax region's rules/conditions are edited by several sub-dialogs
 * (Group 5) with shapes not modeled anywhere else in the app — kept loose
 * here rather than guessed at, matching shipping's zones (design.md -
 * Decision 6).
 */
const TaxRegionFormShape = z.record(z.any());

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
