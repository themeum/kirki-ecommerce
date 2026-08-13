import type { SelectDestinationFormPayload } from '@/features/settings/shipping/schemas/forms/select-destination-form';
import type { CountryWithStates, ShippingRegion, ShippingRule } from '@/features/settings/shipping/types';

export type DestinationConditionValue = {
  country: string;
  states: (string | number)[];
};

type StateOption = { id: string | number; name: string };

export const getCountryOptions = (
  countryList: CountryWithStates[] | null | undefined,
  selectedRegion: ShippingRegion[],
): { label: string; value: string }[] =>
  countryList
    ?.filter((country) =>
      selectedRegion?.some((region) => region.country === country.code),
    )
    .map((country) => ({ label: country.name, value: country.code })) ?? [];

/**
 * The `{country, states}` the form should open with: the stored condition
 * value if it's for the currently selected country, otherwise the region's
 * own recorded states.
 */
export const resolveOpenSelection = (
  selectedCountry: string | null,
  selectedConditionValue: DestinationConditionValue | null,
  selectedRegion: ShippingRegion[],
): { country: string; states: (string | number)[] } => {
  const country = selectedCountry ?? '';
  const statesFromCondition =
    selectedConditionValue?.country === country ? selectedConditionValue.states : null;
  const regionForCountry = selectedRegion?.find(
    (region) => region.country.toLowerCase() === country.toLowerCase(),
  );

  return { country, states: statesFromCondition ?? regionForCountry?.states ?? [] };
};

/**
 * The state list to render, and which of them come pre-selected, once the
 * user picks (or the form is seeded with) a country.
 */
export const resolveStatesForCountry = (
  formCountry: string,
  selectedConditionValue: DestinationConditionValue | null,
  selectedRegion: ShippingRegion[],
  countryList: CountryWithStates[] | null | undefined,
): { stateList: StateOption[]; states: (string | number)[] } => {
  const country = countryList?.find(
    (item) => item.code.toLowerCase() === formCountry.toLowerCase(),
  );
  const stateList = country?.states ?? [];

  const statesFromCondition =
    selectedConditionValue?.country === formCountry ? selectedConditionValue.states : null;
  const regionForCountry = selectedRegion?.find(
    (region) => region.country.toLowerCase() === formCountry.toLowerCase(),
  );

  return {
    stateList,
    states: statesFromCondition ?? regionForCountry?.states ?? [],
  };
};

export const filterStates = (
  stateList: StateOption[],
  searchValue: string,
): StateOption[] => {
  if (!searchValue.trim()) {
    return stateList;
  }
  const query = searchValue.toLowerCase();
  return stateList.filter((state) => state.name.toLowerCase().includes(query));
};

export const toggleState = (
  current: (string | number)[],
  stateId: string | number,
): (string | number)[] =>
  current.includes(stateId)
    ? current.filter((id) => id !== stateId)
    : [...current, stateId];

export const updateRegionStates = (
  regions: ShippingRegion[],
  values: SelectDestinationFormPayload,
): ShippingRegion[] =>
  regions.map((region) =>
    region.country === values.country ? { ...region, states: values.states } : region,
  );

/**
 * Writes the destination selection back into a `destination_region` rule's
 * condition — merging into the existing value when the country hasn't
 * changed, replacing it outright when it has.
 */
export const applyDestinationToRule = (
  rules: ShippingRule[],
  ruleIndex: number,
  values: SelectDestinationFormPayload,
): ShippingRule[] =>
  rules.map((rule, idx) => {
    if (idx !== ruleIndex) {
      return rule;
    }

    const condition = rule.conditions?.[0];
    if (condition?.type !== 'destination_region') {
      return rule;
    }

    const conditionValue = condition.value as DestinationConditionValue;
    const isSameCountry = conditionValue?.country === values.country;

    return {
      ...rule,
      conditions: [
        {
          ...condition,
          value: isSameCountry
            ? { ...conditionValue, states: values.states }
            : { country: values.country, states: values.states },
        },
      ],
    };
  });
