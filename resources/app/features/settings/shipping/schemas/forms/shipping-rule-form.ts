import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const COST_ACTIONS = ['set_shipping_cost', 'add_shipping_cost'];

const ShippingRuleFormShape = z.object({
  condition: required(z.string().default(''), __('Condition is required', 'kirki-ecommerce')),
  operator: z.string().nullish(),
  condition_value: z.unknown().nullish(),
  action: required(z.string().default(''), __('Action is required', 'kirki-ecommerce')),
  action_value: z.union([z.string(), z.number()]).nullish(),
  selected_country: z.string().nullish().default(''),
});

/** Reshapes the flat rule form into the nested `{relation, conditions, action}` structure the shipping zone stores. */
export const ShippingRuleFormSchema = prepareFormSchema(ShippingRuleFormShape).transform((values) => ({
  relation: 'AND' as const,
  conditions: [
    {
      type: values.condition,
      operator: values.operator || '=',
      value: values.condition_value ?? null,
    },
  ],
  action: {
    type: values.action,
    value: COST_ACTIONS.includes(values.action) ? (values.action_value ?? null) : null,
  },
}));

export type ShippingRuleFormInput = z.input<typeof ShippingRuleFormSchema>;

export type ShippingRuleFormPayload = z.output<typeof ShippingRuleFormSchema>;
