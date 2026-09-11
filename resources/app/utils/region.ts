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

export const mergeRegionsByCountry = (regions: Region[] = []): Region[] => {
  const merged = new Map<string, { region: Region; states: Set<string | number> }>();

  regions.forEach((region) => {
    const existing = merged.get(region.country);

    if (existing) {
      region.states.forEach((stateId) => existing.states.add(stateId));
      return;
    }

    merged.set(region.country, {
      region,
      states: new Set(region.states),
    });
  });

  return Array.from(merged.values()).map(({ region, states }) => ({
    country: region.country,
    states: Array.from(states),
    flag: region.flag,
  }));
};

export const getSearchedCountries = <T extends Country>(
  searchValue: string,
  countryList: T[] | null | undefined,
): T[] => {
  const search = searchValue.toLowerCase().trim();

  if (!search) {
    return countryList ?? [];
  }

  return (countryList ?? []).reduce<T[]>((acc, country) => {
    const matchedCountry =
      country?.name?.toLowerCase().includes(search) ||
      country?.code?.toLowerCase().includes(search);

    if (matchedCountry) {
      acc.push(country);
      return acc;
    }

    const matchedStates = (country.states ?? []).filter((state) =>
      state?.name?.toLowerCase().includes(search),
    );

    if (matchedStates.length) {
      acc.push({ ...country, states: matchedStates });
    }

    return acc;
  }, []);
};

export type { RegionTag };
