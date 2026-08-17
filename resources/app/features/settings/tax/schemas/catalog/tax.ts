import { z } from 'zod';

import { ShippingRuleSchema } from '@/features/settings/shipping/schemas/catalog/shipping';

export const TaxProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type TaxProfile = z.infer<typeof TaxProfileSchema>;

/**
 * Keyed by `state` for a general (non-EU) region, by `country` for an EU/OSS
 * region — confirmed against live data (`GET /settings/tax`), where neither
 * `docs/ecommerce/settings/tax.yml` nor the original entity type recorded
 * the `country` variant. Both stay optional; a rate entry is never expected
 * to have both.
 */
export const TaxRateSchema = z
  .object({
    state: z.string().optional(),
    country: z.string().optional(),
    rate: z.union([z.number(), z.string()]),
    flag: z.string().optional(),
  })
  .passthrough();

export type TaxRate = z.infer<typeof TaxRateSchema>;

export const TaxRegionSchema = z
  .object({
    code: z.string().nullish(),
    name: z.string().nullish(),
    type: z.string().nullish(),
    product_tax: z.array(TaxRateSchema).nullish(),
    shipping_tax: z.array(TaxRateSchema).nullish(),
    rules: z.array(ShippingRuleSchema).nullish(),
  })
  .passthrough();

export type TaxRegion = z.infer<typeof TaxRegionSchema>;
