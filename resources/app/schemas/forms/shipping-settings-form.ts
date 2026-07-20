import { z } from 'zod';

export const ShippingSettingsFormSchema = z
  .object({
    shipping_zones: z.array(z.record(z.any())).optional(),
  })
  .passthrough();

export type ShippingSettingsFormValues = z.infer<
  typeof ShippingSettingsFormSchema
>;

export const shippingSettingsDefaultValues: ShippingSettingsFormValues = {
  shipping_zones: [],
};
