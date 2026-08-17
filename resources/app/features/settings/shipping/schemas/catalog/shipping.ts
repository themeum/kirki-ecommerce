import { z } from 'zod';

export const ShippingProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type ShippingProfile = z.infer<typeof ShippingProfileSchema>;

export const ShippingBoxSchema = z.object({
  id: z.number(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  width: z.union([z.number(), z.string()]).nullish(),
  height: z.union([z.number(), z.string()]).nullish(),
  length: z.union([z.number(), z.string()]).nullish(),
  unit: z.string().nullish(),
  is_default: z.boolean().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type ShippingBox = z.infer<typeof ShippingBoxSchema>;

export const ShippingRuleConditionSchema = z
  .object({
    type: z.string(),
    operator: z.string(),
    value: z.unknown(),
  })
  .passthrough();

export type ShippingRuleCondition = z.infer<typeof ShippingRuleConditionSchema>;

export const ShippingRuleActionSchema = z
  .object({
    type: z.string(),
    value: z.unknown(),
  })
  .passthrough();

export type ShippingRuleAction = z.infer<typeof ShippingRuleActionSchema>;

export const ShippingRuleSchema = z
  .object({
    relation: z.string().nullish(),
    conditions: z.array(ShippingRuleConditionSchema).nullish(),
    action: ShippingRuleActionSchema.nullish(),
  })
  .passthrough();

export type ShippingRule = z.infer<typeof ShippingRuleSchema>;

export const ShippingMethodRangeSchema = z
  .object({
    from: z.union([z.number(), z.string()]).nullish(),
    to: z.union([z.number(), z.string()]).nullish(),
    base_amount: z.union([z.number(), z.string()]).nullish(),
  })
  .passthrough();

export type ShippingMethodRange = z.infer<typeof ShippingMethodRangeSchema>;

export const ShippingMethodSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    type: z.string().nullish(),
    name: z.string().nullish(),
    is_enabled: z.boolean().nullish(),
    base_amount: z.union([z.number(), z.string()]).nullish(),
    is_taxable: z.boolean().nullish(),
    description: z.string().nullish(),
    address: z.string().nullish(),
    has_fee: z.boolean().nullish(),
    has_pick_time: z.boolean().nullish(),
    pickup_time_start: z.string().nullish(),
    pickup_time_end: z.string().nullish(),
    ranges: z.array(ShippingMethodRangeSchema).nullish(),
    is_free_shipping_enabled: z.boolean().nullish(),
    base_free_shipping_min_amount: z.union([z.number(), z.string()]).nullish(),
    shipping_rules: z.array(ShippingRuleSchema).nullish(),
  })
  .passthrough();

export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;

export const ShippingRegionSchema = z
  .object({
    country: z.string(),
    states: z.array(z.union([z.string(), z.number()])).nullish(),
  })
  .passthrough();

export type ShippingRegion = z.infer<typeof ShippingRegionSchema>;

export const ShippingCarrierSchema = z
  .object({
    is_enabled: z.boolean().nullish(),
    name: z.string().nullish(),
    type: z.string().nullish(),
    rate: z.union([z.number(), z.string()]).nullish(),
    is_taxable: z.boolean().nullish(),
    description: z.string().nullish(),
    shipping_rules: z.array(ShippingRuleSchema).nullish(),
  })
  .passthrough();

export type ShippingCarrier = z.infer<typeof ShippingCarrierSchema>;

export const ShippingZoneSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    title: z.string().nullish(),
    is_enabled: z.boolean().nullish(),
    regions: z.array(ShippingRegionSchema).nullish(),
    shipping_methods: z.array(ShippingMethodSchema).nullish(),
    shipping_carriers: z.array(ShippingCarrierSchema).nullish(),
  })
  .passthrough();

export type ShippingZone = z.infer<typeof ShippingZoneSchema>;
