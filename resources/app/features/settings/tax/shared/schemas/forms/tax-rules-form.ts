import { z } from 'zod';

import { prepareFormSchema, required, requiredWhen } from '@/libs/zod';
import { __ } from '@/wpi18n';

export const RATE_ACTIONS = ['set_product_tax_rate', 'set_shipping_tax_rate'];

type ConditionValues = { condition?: string; value?: unknown }[];

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/**
 * Shipping tax is resolved with only the destination address in its decision
 * context, so a shipping tax rate rule with any other condition could never match.
 */
const hasNonDestinationCondition = (values: Record<string, unknown>): boolean =>
  values.action_type === 'set_shipping_tax_rate' &&
  ((values.conditions ?? []) as ConditionValues).some((row) => row.condition !== 'destination_region');

const hasBlankConditionValue = (values: Record<string, unknown>): boolean =>
  ((values.conditions ?? []) as ConditionValues).some((row) => isBlank(row.value));

const TaxRulesFormShape = z.object({
  conditions: requiredWhen(
    z.array(
      z.object({
        id: z.string(),
        condition: z.string(),
        operator: z.enum(['=', '!=']).default('='),
        value: z.unknown().nullable(),
        type: z.string().optional(),
      }),
    ),
    (values) => hasBlankConditionValue(values) || hasNonDestinationCondition(values),
    (values) =>
      hasNonDestinationCondition(values)
        ? __('Shipping tax rate rules can only use Destination conditions', 'kirki-ecommerce')
        : __('Every condition needs a value', 'kirki-ecommerce'),
  ),
  action_type: required(z.string().default(''), __('Action is required', 'kirki-ecommerce')),
  action_value: requiredWhen(
    z.union([z.string(), z.number()]).nullish(),
    (values) =>
      RATE_ACTIONS.includes(String(values.action_type)) &&
      (isBlank(values.action_value) || Number.isNaN(Number(values.action_value))),
    __('A valid tax rate is required', 'kirki-ecommerce'),
  ),
  selectedCountries: z.array(z.union([z.string(), z.number()])),
});

/**
 * Reshapes the flat rule form into the nested `{relation, conditions, action}`
 * structure the tax region stores. `selectedCountries` is form-only state
 * that feeds a `destination_region` condition row via `ConditionRow` — it
 * was never part of the stored rule, so it is not in this payload either.
 */
export const TaxRulesFormSchema = prepareFormSchema(TaxRulesFormShape).transform((values) => ({
  relation: 'AND' as const,
  conditions: values.conditions.map((c) => ({
    type: c.condition,
    operator: c.operator,
    value: c.value ?? '',
  })),
  action: {
    type: values.action_type,
    value: values.action_value ?? 0,
  },
}));

export type TaxRulesFormInput = z.input<typeof TaxRulesFormSchema>;

export type TaxRulesFormPayload = z.output<typeof TaxRulesFormSchema>;
