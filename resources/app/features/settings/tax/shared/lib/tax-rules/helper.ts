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
