import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { toast } from 'sonner';

import { StoreIcon, TruckIcon, WeightIcon } from '@/icons';
import { queryClient } from '@/libs/query-client';
import { queryKeys } from '@/libs/query-keys';
import { getErrorMessage } from '@/services/helpers';
import { updateSettings } from '@/services/settings';
import type { Country, SettingsSectionData, ToastVariant } from '@/types';
import { __, _n, sprintf } from '@/wpi18n';

import { getNestedSearchedValue, setUnsavedDataStatus } from '@/pages/settings/utils';

type CountryState = {
  id: string | number;
  name: string;
  code?: string;
  flag?: string;
  title?: string;
};

type CountryWithStates = Country & {
  group?: string;
  states?: CountryState[];
};

type ShippingRegion = {
  country: string;
  states: Array<string | number>;
  hasDeselectedState?: boolean;
  flag?: string;
};

type ShippingRuleCondition = {
  type: string;
  operator: string;
  value: unknown;
};

type ShippingRuleAction = {
  type: string;
  value: unknown;
};

type ShippingRule = {
  relation?: string;
  conditions: ShippingRuleCondition[];
  action: ShippingRuleAction;
};

type ShippingMethodData = {
  id: string | number;
  type: string;
  name?: string;
  is_enabled?: boolean;
  zoneId?: string | number;
  icon?: ReactNode;
  subText?: string;
  rightText?: string;
  shipping_rules?: ShippingRule[];
  amount?: number | string | null;
  is_taxable?: boolean;
  description?: string | null;
  address?: string | null;
  has_fee?: boolean;
  has_pick_time?: boolean;
  pickup_time_start?: string | null;
  pickup_time_end?: string | null;
  ranges?: Array<{
    from: number | string | null;
    to: number | string | null;
    amount: number | string | null;
  }>;
  is_free_shipping_enabled?: boolean;
  free_shipping_min_amount?: number | string | null;
};

type ShippingZone = {
  id: string | number;
  title: string;
  is_enabled: boolean;
  regions: ShippingRegion[];
  shipping_methods: ShippingMethodData[];
  shipping_careers?: unknown[];
};

type RegionTag = {
  id: string;
  title: string;
  tagIcon: ReactNode;
  subText: string;
};

type SaveShippingZonesParams = {
  zones: ShippingZone[];
  from?: string;
  shippingSettingsData: SettingsSectionData | null | undefined;
  toastMessage?: string;
  variant?: ToastVariant;
};

type SelectOption = {
  title: string;
  value: string;
};

export type {
  CountryState,
  CountryWithStates,
  ShippingRegion,
  ShippingRule,
  ShippingRuleCondition,
  ShippingRuleAction,
  ShippingMethodData,
  ShippingZone,
  RegionTag,
  SaveShippingZonesParams,
  SelectOption,
};

export type SetState<T> = Dispatch<SetStateAction<T>>;

export const getSelectedRegionTags = (
  regions: ShippingRegion[] = [],
  countryList: CountryWithStates[] | null | undefined = [],
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
        title: statesCount ? `${selectedCountry.name}-` : selectedCountry.name,
        tagIcon: <span>{selectedCountry.flag}</span>,
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

export const getShippingZoneSummary = (zone: ShippingZone): string => {
  const regionCount = zone?.regions?.length ?? 0;
  const methodCount = zone?.shipping_methods?.length ?? 0;

  return sprintf(
    __('%1$s, %2$s', 'kirki-ecommerce'),
    sprintf(
      _n('%d Region', '%d Regions', regionCount, 'kirki-ecommerce'),
      regionCount,
    ),
    sprintf(
      _n(
        '%d Shipping Method',
        '%d Shipping Methods',
        methodCount,
        'kirki-ecommerce',
      ),
      methodCount,
    ),
  );
};

export const getSearchedCountries = (
  searchValue: string,
  countryList: CountryWithStates[] | null | undefined,
): CountryWithStates[] => {
  if (!searchValue) {
    return countryList ?? [];
  }
  return getNestedSearchedValue(searchValue, countryList ?? [], [
    'states',
  ]) as CountryWithStates[];
};

export const saveShippingZones = async ({
  zones,
  from = '',
  toastMessage = '',
}: SaveShippingZonesParams): Promise<void> => {
  try {
    await updateSettings({
      key: 'shipping',
      data: { shipping_zones: zones },
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.Settings('shipping'),
    });
    setUnsavedDataStatus(false);
    if (from !== 'delete' && toastMessage) {
      toast.success(toastMessage);
    }
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
};

export const shippingMethodIconMap: Record<string, ReactNode> = {
  flat_rate: <TruckIcon />,
  local_pickup: <StoreIcon />,
  weight: <WeightIcon />,
};

const isEmptyAmount = (amount: unknown): boolean =>
  amount === undefined || amount === null || amount === '';

export const getShippingMethodSubText = (method: ShippingMethodData): string | undefined =>
  method.description || undefined;

export const getShippingMethodRightText = (method: ShippingMethodData): string | undefined => {
  const showsAmount =
    (method.type === 'flat_rate' || (method.type === 'local_pickup' && method.has_fee)) &&
    !isEmptyAmount(method.amount);

  return showsAmount ? sprintf(__('$%s', 'kirki-ecommerce'), method.amount as string | number) : undefined;
};

export const conditionOptions: SelectOption[] = [
  {
    title: __('Product Category', 'kirki-ecommerce'),
    value: 'product_category',
  },
  {
    title: __('Shipping Profile', 'kirki-ecommerce'),
    value: 'shipping_profile',
  },

  {
    title: __('Destination', 'kirki-ecommerce'),
    value: 'destination_region',
  },
  {
    title: __('Cart Value (Subtotal)', 'kirki-ecommerce'),
    value: 'cart_weight',
  },
];

export const actionOptionsArray: SelectOption[] = [
  {
    title: __('Set Shipping Price', 'kirki-ecommerce'),
    value: 'set_shipping_cost',
  },
  {
    title: __('Add Extra to Price', 'kirki-ecommerce'),
    value: 'add_shipping_cost',
  },
  {
    title: __('Disable This Shipping Method', 'kirki-ecommerce'),
    value: 'disable_shipping_method',
  },
  {
    title: __('Free Shipping', 'kirki-ecommerce'),
    value: 'set_free_shipping',
  },
];

