import { z } from 'zod';

import { TaxRegionSchema } from '@/features/settings/tax/shared/schemas/catalog/tax';
import { prepareFormSchema } from '@/libs/zod';

/**
 * The form-side view of a tax region is the persisted shape itself
 * ({@link TaxRegionSchema}) — a union of the EU and general regions, each
 * already carrying the fields the region cards and edit pages manage. The
 * union cannot be `.extend()`ed (zod v3 offers that on `ZodObject` only), and
 * no longer needs to be. Every member stays `.passthrough()`, so the deeper
 * rule / rate structures ride through untouched.
 */
export type TaxRegionForm = z.infer<typeof TaxRegionSchema>;

const TaxSettingsFormShape = z.object({
  is_tax_inclusive_price: z.boolean().default(false),
  is_enabled_taxed_price: z.boolean().default(false),
  is_shipping_tax_enabled: z.boolean().default(false),
  tax_regions: z.array(TaxRegionSchema).default([]),
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
