import { z } from 'zod';

export const TaxProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type TaxProfile = z.infer<typeof TaxProfileSchema>;

export const TaxRuleConditionSchema = z
  .object({
    type: z.string().nullish(),
    operator: z.string().nullish(),
    value: z.unknown(),
  })
  .passthrough();

export type TaxRuleCondition = z.infer<typeof TaxRuleConditionSchema>;

export const TaxRuleActionSchema = z
  .object({
    type: z.string().nullish(),
    value: z.unknown(),
  })
  .passthrough();

export type TaxRuleAction = z.infer<typeof TaxRuleActionSchema>;

export const TaxRuleSchema = z
  .object({
    relation: z.string().nullish(),
    conditions: z.array(TaxRuleConditionSchema).nullish(),
    action: TaxRuleActionSchema.nullish(),
  })
  .passthrough();

export type TaxRule = z.infer<typeof TaxRuleSchema>;

/**
 * One state of a general region, keyed by the state's id — never its name. A
 * state carries no flag: the country dataset (`resources/data/countries.json`)
 * has none for any state, only for countries.
 */
export const StateTaxRateSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    product_tax_rate: z.union([z.number(), z.string()]).nullish(),
    shipping_tax_rate: z.union([z.number(), z.string()]).nullish(),
    rules: z.array(TaxRuleSchema).nullish(),
  })
  .passthrough();

export type StateTaxRate = z.infer<typeof StateTaxRateSchema>;

/**
 * One EU member country the region collects VAT in, keyed by country code. A
 * member country has a single VAT rate that applies to both product tax and
 * shipping tax.
 */
export const CountryTaxRateSchema = z
  .object({
    code: z.string(),
    name: z.string().nullish(),
    flag: z.string().nullish(),
    rate: z.union([z.number(), z.string()]).nullish(),
  })
  .passthrough();

export type CountryTaxRate = z.infer<typeof CountryTaxRateSchema>;

/**
 * `name` and `flag` are display copies refreshed from the country dataset
 * whenever the code is known; nothing is ever matched by them.
 */
export const GeneralTaxRegionSchema = z
  .object({
    code: z.string(),
    name: z.string().nullish(),
    flag: z.string().nullish(),
    type: z.string().nullish().default('general'),
    is_enabled: z.boolean().nullish(),
    is_central_tax_enabled: z.boolean().nullish(),
    central_product_tax: z.union([z.number(), z.string()]).nullish(),
    central_shipping_tax: z.union([z.number(), z.string()]).nullish(),
    states: z.array(StateTaxRateSchema).nullish(),
    rules: z.array(TaxRuleSchema).nullish(),
  })
  .passthrough();

export type GeneralTaxRegion = z.infer<typeof GeneralTaxRegionSchema>;

export const EuTaxRegionSchema = z
  .object({
    code: z.literal('EU'),
    name: z.string().nullish(),
    flag: z.string().nullish(),
    type: z.enum(['micro_business', 'oss']).nullish(),
    is_enabled: z.boolean().nullish(),
    countries: z.array(CountryTaxRateSchema).nullish(),
    rules: z.array(TaxRuleSchema).nullish(),
  })
  .passthrough();

export type EuTaxRegion = z.infer<typeof EuTaxRegionSchema>;

/**
 * EU is tried first — its `z.literal('EU')` on `code` is what discriminates the
 * two members, and a general region's `code` would otherwise also accept `EU`.
 */
export const TaxRegionSchema = z.union([EuTaxRegionSchema, GeneralTaxRegionSchema]);

export type TaxRegion = z.infer<typeof TaxRegionSchema>;
