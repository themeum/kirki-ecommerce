import { z } from 'zod';

import { prepareFormSchema, required, requiredWhen } from '@/libs/zod';
import { __ } from '@/wpi18n';

export const VALUE_ACTIONS = ['set_shipping_cost', 'add_shipping_cost', 'multiply_shipping_cost'];

export const NUMERIC_CONDITIONS = ['cart_weight', 'cart_subtotal'];

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

const isNotNumber = (value: unknown): boolean => isBlank(value) || Number.isNaN(Number(value));

const ShippingRuleFormShape = z.object({
  condition: required(z.string().default(''), __('Condition is required', 'kirki-ecommerce')),
  operator: z.string().nullish(),
  condition_value: requiredWhen(
    z.unknown().nullish(),
    (values) =>
      NUMERIC_CONDITIONS.includes(String(values.condition))
        ? isNotNumber(values.condition_value)
        : isBlank(values.condition_value),
    __('A valid condition value is required', 'kirki-ecommerce'),
  ),
  action: required(z.string().default(''), __('Action is required', 'kirki-ecommerce')),
  action_value: requiredWhen(
    z.union([z.string(), z.number()]).nullish(),
    (values) => VALUE_ACTIONS.includes(String(values.action)) && isNotNumber(values.action_value),
    __('A valid number is required', 'kirki-ecommerce'),
  ),
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
    value: VALUE_ACTIONS.includes(values.action) ? (values.action_value ?? null) : null,
  },
}));

export type ShippingRuleFormInput = z.input<typeof ShippingRuleFormSchema>;

export type ShippingRuleFormPayload = z.output<typeof ShippingRuleFormSchema>;
