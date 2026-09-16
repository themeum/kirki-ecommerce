import { RouteConfig } from '@/config/route-config';
import type { TaxRegionBadge } from '@/features/settings/tax/shared/contracts/tax-region-strategy';
import { formatTaxRateLabel } from '@/features/settings/tax/shared/lib/rate-label';
import type { EuTaxRegion, TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import type { Country } from '@/schemas/reference/country';
import { __, _n, sprintf } from '@/wpi18n';

export const resolveEuRegionMeta = (_region: TaxRegion, _countryList: Country[]) => ({
  name: __('European Union', 'kirki-ecommerce'),
  flag: '🇪🇺',
});

export const resolveEuRegionBadges = (region: TaxRegion): TaxRegionBadge[] => {
  const euRegion = region as EuTaxRegion;
  const countryCount = euRegion.countries?.length ?? 0;
  const scheme =
    euRegion.type === 'micro_business'
      ? __('Micro business', 'kirki-ecommerce')
      : euRegion.type === 'oss'
        ? 'OSS'
        : '';

  return [
    ...(scheme ? [{ label: scheme, variant: 'info' as const }] : []),
    {
      /* translators: %d: number of member countries */
      label: sprintf(
        _n('%d Country', '%d Countries', countryCount, 'kirki-ecommerce'),
        countryCount,
      ),
      variant: 'default' as const,
    },
  ];
};

export const resolveEuRegionRateLabel = (region: TaxRegion) => {
  const euRegion = region as EuTaxRegion;

  return formatTaxRateLabel((euRegion.countries ?? []).map((country) => country.rate));
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
