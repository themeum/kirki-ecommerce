import type { GroupedCountryList } from '@/features/settings/tax/lib/helper';
import type { SelectedTaxRegionDraft, TaxRegion } from '@/features/settings/tax/lib/utils';
import { getSearchedCountries } from '@/utils/region';

type CountryStateOption = {
  id: string | number;
  name: string;
  flag?: string;
};

type SelectionResult = {
  countries: string[];
  regions: SelectedTaxRegionDraft[];
};

/**
 * The countries offered in the picker: search-filtered, then narrowed to
 * ones not already added as a tax region.
 */
export const filterAvailableCountries = (
  countryList: GroupedCountryList,
  searchValue: string,
  regions: TaxRegion[],
): GroupedCountryList => {
  if (!countryList?.length) {
    return [];
  }

  const searched = searchValue?.trim()
    ? getSearchedCountries(searchValue, countryList)
    : countryList;

  return searched.filter(
    (country) => !regions.some((region) => region.code === country.code),
  );
};

/**
 * Toggles a whole country in/out of the draft selection. Selecting a
 * country seeds its region draft with every one of its states.
 */
export const toggleCountrySelection = (
  prevCountries: string[],
  prevRegions: SelectedTaxRegionDraft[],
  country: { code: string; name: string; flag?: string; states?: CountryStateOption[] },
): SelectionResult => {
  const isSelected = prevCountries.includes(country.code);
  const countries = isSelected
    ? prevCountries.filter((code) => code !== country.code)
    : [...prevCountries, country.code];

  const exists = prevRegions.find((region) => region.country === country.name);
  const regions = exists
    ? prevRegions.filter((region) => region.country !== country.name)
    : [
      ...prevRegions,
      {
        id: country.code,
        country: country.name,
        states: (country.states ?? []).map((state) => ({
          id: state.id,
          title: String(state.name),
          flag: state.flag || '',
        })),
        hasDeselectedState: false,
        flag: country.flag || '',
      },
    ];

  return { countries, regions };
};

/**
 * Toggles a single state within a country's draft. Deselecting a country's
 * last state drops the country entirely, matching what the checkbox UI
 * shows (an empty country has nothing left to render as selected).
 */
export const toggleStateSelection = (
  prevCountries: string[],
  prevRegions: SelectedTaxRegionDraft[],
  stateId: string | number,
  countryCode: string,
  allStates: CountryStateOption[] = [],
  flag?: string,
): SelectionResult | null => {
  const countryIndex = prevRegions.findIndex((item) => item.id === countryCode);
  if (countryIndex === -1) {
    return null;
  }

  const countryItem = prevRegions[countryIndex];
  const stateExists = countryItem.states.some((state) => state.id === stateId);

  const updatedStates: SelectedTaxRegionDraft['states'] = stateExists
    ? countryItem.states.filter((state) => state.id !== stateId)
    : [
      ...countryItem.states,
      {
        id: stateId,
        title: String(allStates.find((state) => state.id === stateId)?.name || stateId),
        flag: flag || '',
      },
    ];

  if (updatedStates.length === 0) {
    return {
      countries: prevCountries.filter((code) => code !== countryCode),
      regions: prevRegions.filter((_, index) => index !== countryIndex),
    };
  }

  const hasDeselectedState = updatedStates.length !== allStates.length;
  const regions = prevRegions.map((item, index) =>
    index === countryIndex ? { ...item, states: updatedStates, hasDeselectedState } : item,
  );

  return { countries: prevCountries, regions };
};
