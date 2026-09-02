import { __ } from '@/wpi18n';

type SelectOption = {
  title: string;
  value: string;
};

/**
 * `state` keys a general region's rate, `country` an EU/OSS region's —
 * confirmed against live `GET /settings/tax` data, where neither key is
 * guaranteed (see `schemas/catalog/tax.ts`'s `TaxRateSchema`).
 */
type TaxRate = {
  state?: string;
  country?: string;
  rate: number | string;
  flag?: string;
};

type TaxRuleCondition = {
  type: string;
  operator: string;
  value: unknown;
};

type TaxRuleAction = {
  type: string;
  value: unknown;
};

type TaxRule = {
  relation?: string;
  conditions: TaxRuleCondition[];
  action: TaxRuleAction;
};

type TaxRegionState = {
  id: string | number;
  title?: string;
  name?: string;
  flag?: string;
  code?: string;
};

type TaxRegion = {
  code: string;
  name: string;
  is_enabled: boolean;
  states: TaxRegionState[];
  type?: string | null;
  flag?: string;
  product_tax?: TaxRate[];
  shipping_tax?: TaxRate[];
  rules?: TaxRule[];
  central_product_tax?: number | string;
  central_shipping_tax?: number | string;
  is_central_tax_enabled?: boolean;
};

type TaxConditionRow = {
  id: string;
  condition: string;
  value: unknown;
  type?: string;
};

export type {
  SelectOption,
  TaxConditionRow,
  TaxRate,
  TaxRegion,
  TaxRegionState,
  TaxRule,
  TaxRuleAction,
  TaxRuleCondition,
};

export const taxRuleConditionOptions: SelectOption[] = [
  { title: __('Tax Profile', 'kirki-ecommerce'), value: 'tax_profile' },
  { title: __('Destination', 'kirki-ecommerce'), value: 'destination_region' },
];

export const taxRuleActionOptionsArray: SelectOption[] = [
  { title: __('Set Tax Rate', 'kirki-ecommerce'), value: 'set_tax_rate' },
  { title: __('Tax Exempt', 'kirki-ecommerce'), value: 'exempt' },
];
