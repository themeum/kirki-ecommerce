import type { TaxRate, TaxRegion, TaxRegionState, TaxRule } from '@/features/settings/tax/lib/utils';

/**
 * Adds a zero-rate entry for each newly picked city, skipping any that
 * already have a rate. Keyed by `state` — see `TaxRate`'s note on the
 * `state`/`country` ambiguity; general (non-EU) regions use `state`.
 */
export const mergeCitiesIntoTaxRates = (
  taxRates: TaxRate[],
  selectedCities: TaxRegionState[],
): TaxRate[] => {
  const newTaxRates: TaxRate[] = selectedCities.map((city) => ({
    state: String(city.title ?? ''),
    rate: 0,
  }));

  const existingStates = new Set(taxRates.map((rate) => rate.state));
  return [
    ...taxRates,
    ...newTaxRates.filter((rate) => !existingStates.has(rate.state)),
  ];
};

/**
 * Writes a general region's product tax / central-tax fields back into the
 * region list, leaving every other region untouched.
 */
export const applyRegionTaxUpdate = (
  regions: TaxRegion[],
  code: string,
  values: {
    product_tax?: TaxRate[];
    is_central_tax_enabled?: boolean;
    central_product_tax?: number | string;
  },
  updatedTaxRates?: TaxRate[],
): TaxRegion[] =>
  regions.map((region) =>
    region.code === code
      ? {
        ...region,
        product_tax: updatedTaxRates ?? values.product_tax ?? [],
        is_central_tax_enabled: values.is_central_tax_enabled,
        central_product_tax: values.central_product_tax,
      }
      : region,
  );

/**
 * Writes a region's tax rules back into the region list, leaving every
 * other region untouched. Shared by both the general and EU region pages.
 */
export const applyRegionRules = (
  regions: TaxRegion[],
  code: string,
  rules: TaxRule[],
): TaxRegion[] =>
  regions.map((region) => (region.code === code ? { ...region, rules } : region));

/**
 * Writes the EU region's VAT collection type / rate list back into the
 * region list. `product_tax` for an EU region is, per `TaxRate`'s note,
 * actually keyed by `country` — asserted as-is here, not corrected.
 */
export const applyEuRegionUpdate = (
  regions: TaxRegion[],
  values: { type?: string | null; product_tax?: TaxRate[] },
  overrides?: Partial<TaxRegion>,
): TaxRegion[] =>
  regions.map((region) =>
    region.code === 'EU'
      ? { ...region, type: values.type, product_tax: values.product_tax, ...overrides }
      : region,
  );

/**
 * The EU region as rendered: the stored region merged with whatever the
 * form currently holds for its VAT process and rate list, so the page
 * reflects unsaved edits before they're persisted.
 */
export const deriveEuRegion = (
  regions: TaxRegion[],
  vatCollectionProcess: string | null | undefined,
  vatCollectionList: TaxRate[],
): TaxRegion | undefined => {
  const base = regions.find((region) => region.code === 'EU');
  if (!base) {
    return base;
  }
  return { ...base, type: vatCollectionProcess, product_tax: vatCollectionList };
};

/**
 * Switching to `micro_business` collapses the rate list down to its first
 * entry (micro-business VAT is reported at one flat rate); any other
 * process leaves the list untouched.
 */
export const resolveVatProcessChange = (
  nextType: string,
  currentProductTaxList: TaxRate[],
): TaxRate[] | undefined => {
  if (nextType !== 'micro_business') {
    return undefined;
  }
  if (!Array.isArray(currentProductTaxList) || currentProductTaxList.length === 0) {
    return undefined;
  }
  return [currentProductTaxList[0]];
};
