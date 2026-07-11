import type { Country } from '@/types';

type CountryState = {
  id: string | number;
  name: string;
  code?: string;
  flag?: string;
};

type CountryWithGroup = Country & {
  group?: string;
  states?: CountryState[];
};

type EuGroupedCountry = {
  name: string;
  code: string;
  group: string;
  flag: string;
  states: Array<{
    id: string;
    name: string;
    code: string;
    flag?: string;
  }>;
};

type GroupedCountryList = Array<CountryWithGroup | EuGroupedCountry>;

export type { CountryWithGroup, EuGroupedCountry, GroupedCountryList };

export const groupEUCountries = (
  countryList: CountryWithGroup[] | null | undefined = [],
): GroupedCountryList => {
  if (!Array.isArray(countryList)) {
    return [];
  }

  const euCountries: CountryWithGroup[] = [];
  const nonEuCountries: CountryWithGroup[] = [];

  countryList.forEach((country) => {
    if (country.group === 'eu') {
      euCountries.push(country);
    } else {
      nonEuCountries.push(country);
    }
  });

  if (!euCountries.length) {
    return nonEuCountries;
  }

  const euCountry: EuGroupedCountry = {
    name: 'EU',
    code: 'EU',
    group: 'eu',
    flag: '🇪🇺',
    states: euCountries.map((country) => ({
      id: country.name,
      name: country.name,
      code: country.code,
      flag: country.flag,
    })),
  };

  return [euCountry, ...nonEuCountries];
};
