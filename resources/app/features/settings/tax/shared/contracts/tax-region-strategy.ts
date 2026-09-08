import type { RouteObject } from 'react-router';

import type { TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import type { Country } from '@/schemas/reference/country';

export type TaxStrategyKey = 'EU' | 'DEFAULT';

/**
 * What one region kind owns: how it is displayed, where a merchant is taken
 * to edit it, what a newly added region of that kind looks like, and the
 * routes it serves. Every part is required — a strategy that omits one
 * fails the type check rather than the region list silently falling back.
 */
export type TaxRegionStrategy = {
  key: TaxStrategyKey;
  createRegion: (country: Country) => TaxRegion;
  /**
   * `countryList` is the live country dataset (`useCountriesQuery`), needed
   * because the general strategy resolves a region's display name/flag from
   * it (falling back to the region's persisted `name`/`flag`); the EU
   * strategy ignores it and returns its fixed name/flag.
   */
  resolveMeta: (region: TaxRegion, countryList: Country[]) => { name: string; flag: string };
  resolveSummary: (region: TaxRegion) => string;
  buildEditLink: (region: TaxRegion) => string;
  routes: RouteObject[];
};
