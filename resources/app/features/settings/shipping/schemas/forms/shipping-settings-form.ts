import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';

/**
 * A shipping zone's regions/shipping_methods/rules are edited by several
 * sub-dialogs (Group 5) with their own deep, evolving shapes not modeled
 * anywhere else in the app — kept loose here rather than guessed at, matching
 * the leniency this migration deliberately preserves for unmodeled nested
 * structures (see design.md - Decision 6).
 */
const ShippingZoneFormShape = z.record(z.any());

const ShippingSettingsFormShape = z.object({
  shipping_zones: z.array(ShippingZoneFormShape).default([]),
});

export const ShippingSettingsFormSchema = prepareFormSchema(ShippingSettingsFormShape).transform((values) => ({
  shipping_zones: values.shipping_zones,
}));

export type ShippingSettingsFormInput = z.input<typeof ShippingSettingsFormSchema>;

export type ShippingSettingsFormPayload = z.output<typeof ShippingSettingsFormSchema>;
