import {
  type ShippingRuleFormInput,
  type ShippingRuleFormPayload,
  ShippingRuleFormSchema,
} from '@/features/settings/shipping/schemas/forms/shipping-rule-form';
import type { ShippingRegion, ShippingRule } from '@/features/settings/shipping/types';
import { getDefaults } from '@/libs/zod';
import { __ } from '@/wpi18n';

export type ConditionDataMap = Record<
  string,
  { id: number | string; name: string }[] | null
>;

/**
 * Hydrates the rule form from an existing rule for edit mode, unpacking the
 * `destination_region` condition's `{country, states}` shape into the two
 * form fields it's split across.
 */
export const buildRuleDefaultValues = (initialRule?: ShippingRule): ShippingRuleFormInput => {
  if (!initialRule) {
    return getDefaults(ShippingRuleFormSchema);
  }

  const condition = initialRule.conditions?.[0];
  const action = initialRule.action;
  const isDestination = condition?.type === 'destination_region';

  return {
    condition: condition?.type || 'product_category',
    operator: condition?.operator || 'is',
    condition_value: isDestination
      ? {
        country: (condition.value as { country: string }).country,
        states: (condition.value as { states?: (string | number)[] }).states ?? [],
      }
      : (condition?.value ?? null),
    action: action?.type || 'set_shipping_cost',
    action_value: (action?.value as string | number) ?? '',
    selected_country: isDestination ? (condition.value as { country: string }).country : null,
  };
};

/**
 * Replaces the rule at `ruleIndex` when editing, or appends a new one.
 */
export const mergeRuleIntoMethodRules = (
  existingRules: ShippingRule[] | undefined,
  rule: ShippingRuleFormPayload,
  ruleIndex: number,
): ShippingRule[] => {
  const rules = existingRules ?? [];

  if (ruleIndex !== -1) {
    return rules.map((existingRule, idx) => (idx === ruleIndex ? rule : existingRule));
  }
  return [...rules, rule];
};

export const getConditionValueOptions = (
  selectedCondition: string | null | undefined,
  conditionData: ConditionDataMap,
): { label: string; value: string }[] => {
  const data = conditionData[selectedCondition || ''];

  switch (selectedCondition) {
    case 'product_category':
    case 'shipping_profile':
      return (
        data?.map((item) => ({
          label: item.name,
          value: item.name,
        })) ?? []
      );

    default:
      return [];
  }
};

export const getOperatorOptions = (
  selectedCondition: string | null | undefined,
): { label: string; value: string }[] => {
  if (selectedCondition === 'cart_weight') {
    return [
      { label: __('> (Greater than)', 'kirki-ecommerce'), value: '>' },
      { label: __('= (Equal to)', 'kirki-ecommerce'), value: '=' },
      { label: __('< (Less than)', 'kirki-ecommerce'), value: '<' },
    ];
  }
  return [{ label: __('is', 'kirki-ecommerce'), value: 'is' }];
};

export type DestinationSelection = {
  selectedCountry: string;
  conditionValue: { country: string; states: (string | number)[] } | null;
};

/**
 * Resolves which country/region a `destination_region` condition should
 * hold: the explicitly picked country if there is one, otherwise the first
 * region on record. `condition_value` is only (re)written outside edit
 * mode, so opening an existing rule for editing doesn't clobber it.
 */
export const resolveDestinationSelection = (
  selectedCountry: string | null | undefined,
  selectedRegion: ShippingRegion[],
  mode: 'add' | 'edit',
): DestinationSelection => {
  const country = selectedCountry || selectedRegion[0]?.country || '';
  const regionForCountry = selectedRegion.find((region) => region.country === country);

  return {
    selectedCountry: country,
    conditionValue:
      country && mode !== 'edit'
        ? { country, states: regionForCountry?.states ?? [] }
        : null,
  };
};
