import type {
  CountryTaxRate,
  EuTaxRegion,
  TaxRegion,
} from '@/features/settings/tax/shared/lib/utils';

/**
 * Writes the EU region's VAT collection type / per-country rate list back into
 * the region list.
 */
export const applyEuRegionUpdate = (
  regions: TaxRegion[],
  values: { type?: EuTaxRegion['type']; countries?: CountryTaxRate[] },
  overrides?: Partial<TaxRegion>,
): TaxRegion[] =>
  regions.map((region) =>
    region.code === 'EU'
      ? ({
          ...(region as EuTaxRegion),
          type: values.type,
          countries: values.countries,
          ...overrides,
        } as EuTaxRegion)
      : region,
  );

/**
 * The EU region as rendered: the stored region merged with whatever the
 * form currently holds for its VAT process and country list, so the page
 * reflects unsaved edits before they're persisted.
 */
export const deriveEuRegion = (
  regions: TaxRegion[],
  vatCollectionProcess: EuTaxRegion['type'],
  vatCollectionList: CountryTaxRate[],
): TaxRegion | undefined => {
  const base = regions.find((region) => region.code === 'EU');
  if (!base) {
    return base;
  }
  return { ...(base as EuTaxRegion), type: vatCollectionProcess, countries: vatCollectionList };
};

/**
 * Switching to `micro_business` collapses the country list down to its first
 * entry (micro-business VAT is reported at one flat rate); any other
 * process leaves the list untouched.
 */
export const resolveVatProcessChange = (
  nextType: string,
  currentCountries: CountryTaxRate[],
): CountryTaxRate[] | undefined => {
  if (nextType !== 'micro_business') {
    return undefined;
  }
  if (!Array.isArray(currentCountries) || currentCountries.length === 0) {
    return undefined;
  }
  return [currentCountries[0]];
};
