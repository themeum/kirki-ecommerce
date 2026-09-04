import { RouteConfig } from '@/config/route-config';
import type { EuTaxRegion, TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import type { Country } from '@/schemas/reference/country';
import { __, _n, sprintf } from '@/wpi18n';

export const resolveEuRegionMeta = (_region: TaxRegion, _countryList: Country[]) => ({
  name: __('European Union', 'kirki-ecommerce'),
  flag: '🇪🇺',
});

export const resolveEuRegionSummary = (region: TaxRegion) => {
  const euRegion = region as EuTaxRegion;
  const countryCount = euRegion.countries?.length ?? 0;
  const type =
    euRegion.type === 'micro_business'
      ? __('Micro business', 'kirki-ecommerce')
      : euRegion.type === 'oss'
        ? 'OSS'
        : '';
  /* translators: %s: region type, %d: number of member countries */
  return sprintf(
    _n('%s%d Country', '%s%d Countries', countryCount, 'kirki-ecommerce'),
    `${type ? `${type}, ` : ''}`,
    countryCount,
  );
};

export const buildEuRegionEditLink = () =>
  RouteConfig.Settings.get('TaxSettings').get('EditRegionEU').buildLink();

export const createEuRegion = (_country: Country): TaxRegion => ({
  code: 'EU',
  name: __('European Union', 'kirki-ecommerce'),
  flag: '🇪🇺',
  is_enabled: true,
  type: 'oss',
  countries: [],
  rules: [],
});
