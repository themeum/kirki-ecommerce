import { z } from 'zod';

import { prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const TaxRulesFormShape = z.object({
  conditions: z.array(
    z.object({
      id: z.string(),
      condition: z.string(),
      value: z.unknown().nullable(),
      type: z.string().optional(),
    }),
  ),
  action_type: required(z.string().default(''), __('Action is required', 'kirki-ecommerce')),
  action_value: z.union([z.string(), z.number()]).nullish(),
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
    operator: '=',
    value: c.value ?? '',
  })),
  action: {
    type: values.action_type,
    value: values.action_value ?? 0,
  },
}));

export type TaxRulesFormInput = z.input<typeof TaxRulesFormSchema>;

export type TaxRulesFormPayload = z.output<typeof TaxRulesFormSchema>;
