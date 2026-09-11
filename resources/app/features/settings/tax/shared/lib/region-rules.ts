import type { TaxRegion, TaxRule } from '@/features/settings/tax/shared/lib/utils';

/**
 * Writes a region's tax rules back into the region list, leaving every
 * other region untouched. Shared by both the general and EU region pages.
 */
export const applyRegionRules = (
  regions: TaxRegion[],
  code: string,
  rules: TaxRule[],
): TaxRegion[] => regions.map((region) => (region.code === code ? { ...region, rules } : region));
