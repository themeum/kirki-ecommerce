import type { Dispatch, ReactNode, SetStateAction } from 'react';

import type { ShippingSettings } from '@/schemas/catalog/settings';
import type { Country } from '@/schemas/reference/country';
import type { Region } from '@/schemas/shared/region';
import type { ToastVariant } from '@/types/pages/common';

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

type ShippingRegion = Region;

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
  base_amount?: number | string | null;
  is_taxable?: boolean;
  description?: string | null;
  address?: string | null;
  has_fee?: boolean;
  has_pick_time?: boolean;
  pickup_time_start?: string | null;
  pickup_time_end?: string | null;
  ranges?: {
    from: number | string | null;
    to: number | string | null;
    base_amount: number | string | null;
  }[];
  is_free_shipping_enabled?: boolean;
  base_free_shipping_min_amount?: number | string | null;
};

type ShippingZone = {
  id: string | number;
  title: string;
  is_enabled: boolean;
  regions: ShippingRegion[];
  shipping_methods: ShippingMethodData[];
  shipping_careers?: unknown[];
};

type SaveShippingZonesParams = {
  zones: ShippingZone[];
  from?: string;
  shippingSettingsData: ShippingSettings | null | undefined;
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
  SaveShippingZonesParams,
  SelectOption, ShippingMethodData, ShippingRegion,
  ShippingRule, ShippingRuleAction, ShippingRuleCondition, ShippingZone,
};

export type SetState<T> = Dispatch<SetStateAction<T>>;
