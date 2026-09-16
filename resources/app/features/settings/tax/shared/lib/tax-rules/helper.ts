import { taxRuleConditionOptions } from '@/features/settings/tax/shared/lib/utils';
import type { TaxProfile, TaxRuleCondition } from '@/features/settings/tax/shared/schemas/catalog/tax';
import { __ } from '@/wpi18n';

/**
 * A `destination_region` condition value is `{ country, state? }` — `country` a
 * single code (a general region) or an array of codes (the EU region), `state`
 * an optional list of state ids. Legacy values were a bare id array.
 */
export const resolveSelectedDestinations = (value: unknown): (string | number)[] => {
  if (Array.isArray(value)) {
    return value as (string | number)[];
  }

  if (value && typeof value === 'object') {
    const { state, country } = value as { state?: unknown; country?: unknown };

    if (Array.isArray(state)) {
      return state as (string | number)[];
    }

    if (Array.isArray(country)) {
      return country as (string | number)[];
    }
  }

  return [];
};

export const getDestinationDisplayValue = (value: unknown): string => {
  const list = resolveSelectedDestinations(value);

  if (list.length === 0) {
    return __('Select regions', 'kirki-ecommerce');
  }

  if (list.length === 1) {
    return String(list[0]);
  }

  return `${list[0]} +${list.length - 1}…`;
};

/**
 * Read-only label for a rule condition's value. A `tax_profile` condition stores
 * the profile id; resolve it back to the profile name for display.
 */
export const resolveConditionDisplayValue = (
  condition: TaxRuleCondition | undefined,
  taxProfiles: TaxProfile[] = [],
): string => {
  const value = condition?.value;

  if (condition?.type === 'tax_profile') {
    const profile = taxProfiles.find((item) => String(item.id) === String(value));

    return profile?.name ?? String(value);
  }

  return String(value);
};

/**
 * Read-only label for a rule condition's type. The stored value is the
 * decision engine's condition key (`tax_profile`); the preview shows the same
 * wording the rule editor offers for it.
 */
export const resolveConditionTypeLabel = (type: string | null | undefined): string =>
  taxRuleConditionOptions.find((option) => option.value === type)?.title ?? type ?? '';

/**
 * Read-only label for a rule condition's operator. The stored value is the
 * comparison symbol the decision engine evaluates (`Condition::compare`); the
 * preview reads it as part of a sentence, so `=` becomes `is`.
 */
export const resolveOperatorLabel = (operator: string | null | undefined): string => {
  switch (operator) {
    case '!=':
      return __('is not', 'kirki-ecommerce');
    case '>':
      return __('is greater than', 'kirki-ecommerce');
    case '<':
      return __('is less than', 'kirki-ecommerce');
    case '>=':
      return __('is at least', 'kirki-ecommerce');
    case '<=':
      return __('is at most', 'kirki-ecommerce');
    case 'in':
      return __('is one of', 'kirki-ecommerce');
    case '!in':
      return __('is not one of', 'kirki-ecommerce');
    default:
      return __('is', 'kirki-ecommerce');
  }
};

/**
 * Read-only label for a rule's action. The rule editor offers imperative
 * titles ("Set Tax Rate"); the preview continues the sentence after "Then",
 * and `set_product_tax_rate` is followed by the rate itself.
 */
export const resolveActionLabel = (type: string | null | undefined): string => {
  if (type === 'set_product_tax_rate') {
    return __('product tax rate is', 'kirki-ecommerce');
  }

  if (type === 'set_product_tax_exempt') {
    return __('product tax is exempt', 'kirki-ecommerce');
  }

  return type ?? '';
};
