import type { ReactNode } from 'react';

import type { Country } from '@/schemas/reference/country';
import type { Region } from '@/schemas/shared/region';
import { _n, sprintf } from '@/wpi18n';

type RegionTag = {
  id: string;
  title: string;
  tagIcon: ReactNode;
  subText: string;
};

export const getSelectedRegionTags = (
  regions: Region[] = [],
  countryList: Country[] | null | undefined = [],
): RegionTag[] => {
  return regions
    .map((region) => {
      const selectedCountry = countryList?.find(
        (country) =>
          country?.code?.toLowerCase() === region?.country?.toLowerCase(),
      );

      if (!selectedCountry) {
        return null;
      }

      const statesCount = region?.states?.length || 0;

      return {
        id: selectedCountry?.code,
        title: selectedCountry.name,
        tagIcon: selectedCountry.flag,
        subText: statesCount
          ? sprintf(
            _n('%d State', '%d States', statesCount, 'kirki-ecommerce'),
            statesCount,
          )
          : '',
      };
    })
    .filter(Boolean) as RegionTag[];
};

export const getSearchedCountries = <T extends Country>(
  searchValue: string,
  countryList: T[] | null | undefined,
): T[] => {
  if (!searchValue) {
    return countryList ?? [];
  }

  const search = searchValue.toLowerCase().trim();

  return (countryList ?? []).reduce<T[]>((acc, country) => {
    const matchedStates = (country.states ?? []).filter((state) =>
      state?.name?.toLowerCase().includes(search),
    );

    if (matchedStates.length) {
      acc.push({ ...country, states: matchedStates });
      return acc;
    }

    if (country?.name?.toLowerCase().includes(search)) {
      acc.push(country);
    }

    return acc;
  }, []);
};

export type { RegionTag };
