import { RouteConfig } from '@/config/route-config';
import type { TaxRegionBadge } from '@/features/settings/tax/shared/contracts/tax-region-strategy';
import { formatTaxRateLabel } from '@/features/settings/tax/shared/lib/rate-label';
import type { GeneralTaxRegion, TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import type { Country } from '@/schemas/reference/country';
import { __, _n, sprintf } from '@/wpi18n';

/**
 * The country dataset is authoritative whenever the code is known; the
 * persisted `name`/`flag` are only a fallback for a code it doesn't carry.
 */
export const resolveGeneralRegionMeta = (region: TaxRegion, countryList: Country[]) => {
  const country = countryList.find((item) => item.code === region.code);
  return {
    name: country?.name ?? region.name ?? region.code,
    flag: country?.flag ?? region.flag ?? '',
  };
};

export const resolveGeneralRegionBadges = (region: TaxRegion): TaxRegionBadge[] => {
  const general = region as GeneralTaxRegion;
  const stateCount = general.states?.length ?? 0;

  if (general.is_central_tax_enabled || stateCount === 0) {
    return [{ label: __('Entire country', 'kirki-ecommerce'), variant: 'default' }];
  }

  return [
    {
      /* translators: %d: number of states */
      label: sprintf(_n('%d Region', '%d Regions', stateCount, 'kirki-ecommerce'), stateCount),
      variant: 'default',
    },
  ];
};

export const resolveGeneralRegionRateLabel = (region: TaxRegion) => {
  const general = region as GeneralTaxRegion;

  if (general.is_central_tax_enabled) {
    return formatTaxRateLabel([general.central_product_tax]);
  }

  return formatTaxRateLabel((general.states ?? []).map((state) => state.product_tax_rate));
};

export const buildGeneralRegionEditLink = (region: TaxRegion) =>
  RouteConfig.Settings.get('TaxSettings').get('EditTaxRegion').buildLink({ code: region.code });

export const createGeneralRegion = (country: Country): TaxRegion => ({
  code: country.code,
  name: country.name,
  flag: country.flag,
  is_enabled: true,
  type: null,
  is_central_tax_enabled: true,
  central_product_tax: 0,
  central_shipping_tax: 0,
  states: [],
  rules: [],
});
