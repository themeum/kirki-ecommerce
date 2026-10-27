import type { DestinationConditionValue } from '@/features/settings/shipping/lib/shipping-rules/destination-selection';
import { actionOptionsArray, conditionOptions } from '@/features/settings/shipping/lib/utils';
import type { ShippingRule } from '@/features/settings/shipping/types';
import type { Country } from '@/schemas/reference/country';
import { toDisplayString } from '@/utils/string';
import { __ } from '@/wpi18n';

type ResolveDestinationRegionParams = {
  shippingSettingsData:
    | {
        shipping_zones?: {
          id: string | number;
          regions?: unknown;
          shipping_methods?: { id: string | number }[];
        }[];
      }
    | null
    | undefined;
  methodID: string | number | null | undefined;
  setSelectedRegion: (regions: unknown) => void;
  activeZoneId?: string | number | null;
};

export const resolveDestinationRegion = ({
  shippingSettingsData,
  methodID,
  setSelectedRegion,
  activeZoneId,
}: ResolveDestinationRegionParams): void => {
  if (!shippingSettingsData?.shipping_zones) {
    return;
  }

  const zone = methodID
    ? shippingSettingsData.shipping_zones.find((zone) =>
        zone.shipping_methods?.some((m) => m.id === methodID),
      )
    : shippingSettingsData.shipping_zones.find((zone) => zone.id === activeZoneId);

  setSelectedRegion(zone?.regions);
};

export const toSentenceCase = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export const getConditionLabel = (type?: string): string =>
  toSentenceCase(conditionOptions.find((option) => option.value === type)?.title ?? type ?? '');

export const getOperatorLabel = (operator?: string): string => {
  if (operator === '>') {
    return __('is greater than', 'kirki-ecommerce');
  }
  if (operator === '<') {
    return __('is less than', 'kirki-ecommerce');
  }
  return __('is', 'kirki-ecommerce');
};

export const getActionLabel = (type?: string): string => {
  switch (type) {
    case 'set_shipping_cost':
      return __('Shipping price:', 'kirki-ecommerce');
    case 'add_shipping_cost':
      return __('Extra shipping price:', 'kirki-ecommerce');
    case 'multiply_shipping_cost':
      return __('Shipping price multiplier:', 'kirki-ecommerce');
    case 'set_free_shipping':
    case 'disable_shipping_method':
      return __('Shipping:', 'kirki-ecommerce');
    default:
      return actionOptionsArray.find((option) => option.value === type)?.title ?? type ?? '';
  }
};

export const getActionValue = (
  action: ShippingRule['action'] | undefined,
  currencySymbol: string,
): string => {
  switch (action?.type) {
    case 'set_shipping_cost':
    case 'add_shipping_cost':
      return `${currencySymbol}${toDisplayString(action.value)}`;
    case 'multiply_shipping_cost':
      return toDisplayString(action.value);
    case 'set_free_shipping':
      return __('Free Shipping', 'kirki-ecommerce');
    case 'disable_shipping_method':
      return __('Disabled', 'kirki-ecommerce');
    default:
      return '';
  }
};

export const resolveConditionDisplayValue = (
  type: string | undefined,
  value: unknown,
  categories: { id: number | string; name: string }[],
  shippingProfiles: { id: number | string; name: string }[],
): string => {
  if (type === 'product_categories') {
    return (
      categories.find((item) => String(item.id) === String(value))?.name ?? toDisplayString(value)
    );
  }

  if (type === 'shipping_profile') {
    return (
      shippingProfiles.find((item) => String(item.id) === String(value))?.name ??
      toDisplayString(value)
    );
  }

  return toDisplayString(value);
};

export const getCountryName = (
  code: string | null | undefined,
  countries: { code: string; name: string }[],
): string => {
  if (!code) {
    return '';
  }

  return countries.find((item) => item.code.toLowerCase() === code.toLowerCase())?.name ?? code;
};

export const getDestinationLabel = (
  value: DestinationConditionValue | null | undefined,
  countries: Country[],
): string => {
  if (!value?.country) {
    return '';
  }

  const country = countries.find((item) => item.code.toLowerCase() === value.country.toLowerCase());
  const stateNames = (value.states ?? []).map(
    (id) => country?.states?.find((state) => String(state.id) === String(id))?.name ?? String(id),
  );

  if (stateNames.length === 0) {
    return __('Select destinations', 'kirki-ecommerce');
  }

  if (stateNames.length === 1) {
    return stateNames[0];
  }

  return `${stateNames[0]}, +${stateNames.length - 1}`;
};

export const resolveConditionValues = (
  condition: ShippingRule['conditions'][number] | undefined,
  categories: { id: number | string; name: string }[],
  shippingProfiles: { id: number | string; name: string }[],
  currencySymbol: string,
  countries: { code: string; name: string }[],
): string[] => {
  if (condition?.type === 'destination_region') {
    const country = (condition.value as { country?: string })?.country;

    return country ? [getCountryName(country, countries)] : [];
  }

  if (condition?.type === 'cart_subtotal') {
    return [`${currencySymbol}${toDisplayString(condition.value)}`];
  }

  return [
    resolveConditionDisplayValue(condition?.type, condition?.value, categories, shippingProfiles),
  ];
};
