import type { AddressRules, Country } from '@/schemas/reference/country';
import { __ } from '@/wpi18n';

type AddressRuleField = 'state' | 'postal_code';

/**
 * Countries the API has described so far, keyed by uppercase ISO code.
 *
 * Form schemas are plain objects evaluated synchronously, so they cannot
 * await the countries query. They read the rules from here instead, filled
 * as a side effect of the fetch the forms already depend on.
 */
const knownRules: Record<string, AddressRules> = {};

/**
 * Built per call rather than held in a constant so the fallback label is
 * translated at call time, once wp.i18n has loaded.
 */
const fallbackRules = (): AddressRules => ({
  state: { mode: 'optional', label: __('Region', 'kirki-ecommerce') },
  postal_code: { mode: 'optional' },
});

/**
 * Merges rather than replaces: a filtered country fetch must not discard
 * what an earlier, wider fetch already taught us.
 */
const cacheAddressRules = (countries: Country[]) => {
  countries.forEach((country) => {
    if (country.address_rules) {
      knownRules[country.code.toUpperCase()] = country.address_rules;
    }
  });
};

const getAddressRules = (country?: string | null): AddressRules => {
  if (!country) {
    return fallbackRules();
  }

  return knownRules[country.toUpperCase()] ?? fallbackRules();
};

/**
 * Whether a country demands an address field.
 *
 * A country whose rules have not arrived yet reads as not required. The
 * server applies the same rules on submit, so an unknown country is caught
 * there rather than blocking a form on data it has not loaded.
 */
const isAddressFieldRequired = (country: string | null | undefined, field: AddressRuleField) => {
  return getAddressRules(country)[field].mode === 'required';
};

const getStateLabel = (country?: string | null) => getAddressRules(country).state.label;

export { cacheAddressRules, getAddressRules, getStateLabel, isAddressFieldRequired };
export type { AddressRuleField };
