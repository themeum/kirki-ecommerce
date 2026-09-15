import type { RouteObject } from 'react-router';

import type { BadgeVariant } from '@/components/ui/badge';
import type { TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import type { Country } from '@/schemas/reference/country';

export type TaxStrategyKey = 'EU' | 'DEFAULT';

/**
 * One property of a region, shown as its own chip in the region list. A kind
 * decides both what its properties are and how each is styled — the scheme a
 * region is registered under and how much territory it covers are different
 * things and do not share a variant.
 */
export type TaxRegionBadge = {
  label: string;
  variant: BadgeVariant;
};

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
  resolveBadges: (region: TaxRegion) => TaxRegionBadge[];
  /**
   * The percentage the region list shows for the region. Where a kind's rates
   * live — one country-wide field, one per state, one per member country — is
   * the kind's own business, so the list never reads them itself. Empty when
   * the region has no rate configured yet.
   */
  resolveRateLabel: (region: TaxRegion) => string;
  buildEditLink: (region: TaxRegion) => string;
  routes: RouteObject[];
};
