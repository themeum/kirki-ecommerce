import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { toast } from 'sonner';

import { StoreIcon, TruckIcon, WeightIcon } from '@/icons';
import { queryClient } from '@/libs/query-client';
import { queryKeys } from '@/libs/query-keys';
import { getErrorMessage } from '@/services/helpers';
import { updateSettings } from '@/services/settings';
import type { Country, SettingsSectionData, ToastVariant } from '@/types';
import { __ } from '@/wpi18n';

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
  shipping_rules?: ShippingRule[];
  base_amount?: number | string;
  is_taxable?: boolean;
  description?: string | null;
  address?: string | null;
  has_fee?: boolean;
  has_pick_time?: boolean;
  pickup_time_start?: string | null;
  pickup_time_end?: string | null;
  ranges?: Array<{
    from: number | string;
    to: number | string;
    base_amount: number | string;
  }>;
  is_free_shipping_enabled?: boolean;
  base_free_shipping_min_amount?: number | string;
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

type MethodSchema = Record<string, unknown>;

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
  MethodSchema,
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
        title: selectedCountry.name,
        tagIcon: <span>{selectedCountry.flag}</span>,
        subText: statesCount ? `${statesCount} states` : '',
      };
    })
    .filter(Boolean) as RegionTag[];
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
  shippingSettingsData,
  toastMessage = '',
}: SaveShippingZonesParams): Promise<void> => {
  try {
    await updateSettings({
      key: 'shipping',
      data: {
        ...shippingSettingsData,
        shipping_zones: zones,
      },
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
  local_pickup: <WeightIcon />,
  weight: <StoreIcon />,
};

export const conditionOptions: SelectOption[] = [
  {
    title: __('Product Category', 'kirki-ecommerce'),
    value: 'product_categories',
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

export const METHOD_SCHEMAS: Record<string, MethodSchema> = {
  flat_rate: {
    base_amount: 0,
    is_taxable: false,
    description: null,
  },

  local_pickup: {
    address: null,
    has_fee: false,
    base_amount: 0,
    is_taxable: false,
    description: null,
    has_pick_time: false,
    pickup_time_start: null,
    pickup_time_end: null,
  },

  weight: {
    ranges: [],
    base_amount: 0,
    is_taxable: false,
    description: null,
  },
};
