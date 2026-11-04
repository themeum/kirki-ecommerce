import type { OnboardingDefaults } from '@/features/onboarding/schemas/catalog/onboarding-defaults';
import type { OnboardingFormInput } from '@/features/onboarding/schemas/forms/onboarding-form';

type PrefillOptions = {
  countryCodes: readonly string[];
  currencyCodes: readonly string[];
};

const toFormPrefill = (
  defaults: OnboardingDefaults | undefined,
  { countryCodes, currencyCodes }: PrefillOptions,
): Partial<OnboardingFormInput> => {
  if (!defaults?.source) {
    return {};
  }

  const { country, currency, store_address, ...rest } = defaults.values;
  const prefill: Partial<OnboardingFormInput> = { ...rest };

  if (country && countryCodes.includes(country)) {
    prefill.country = country;
    prefill.store_address = store_address;
  }

  if (currency && currencyCodes.includes(currency)) {
    prefill.currency = currency;
  }

  return prefill;
};

export { toFormPrefill };
