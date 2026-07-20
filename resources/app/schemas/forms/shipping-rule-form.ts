import { z } from 'zod';

import { optionalNullableString } from '@/schemas/forms/shared/validators';

export const ShippingRuleFormSchema = z.object({
  condition: z.string().min(1),
  operator: z.string().optional().nullable(),
  condition_value: z.any().optional().nullable(),
  action: z.string().min(1),
  action_value: z.union([z.string(), z.number()]).optional().nullable(),
  selected_country: optionalNullableString(),
});

export type ShippingRuleFormValues = z.infer<typeof ShippingRuleFormSchema>;

export const shippingRuleDefaultValues: ShippingRuleFormValues = {
  condition: 'product_category',
  operator: 'is',
  condition_value: null,
  action: 'set_shipping_cost',
  action_value: '',
  selected_country: null,
};
