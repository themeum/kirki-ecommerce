import type {
  CountryTaxRate,
  EuTaxRegion,
  GeneralTaxRegion,
  StateTaxRate,
  TaxRegion,
  TaxRule,
} from '@/features/settings/tax/shared/schemas/catalog/tax';
import { __ } from '@/wpi18n';

type SelectOption = {
  title: string;
  value: string;
};

/**
 * A state/province as shown in the editor. Purely a display shape resolved
 * from the country dataset (`useCountriesQuery`) at render time — never part
 * of the persisted region, which stores {@link StateTaxRate} instead.
 */
type TaxRegionState = {
  id: string | number;
  title?: string;
  name?: string;
  flag?: string;
  code?: string;
};

type TaxConditionRow = {
  id: string;
  condition: string;
  value: unknown;
  type?: string;
};

export type {
  CountryTaxRate,
  EuTaxRegion,
  GeneralTaxRegion,
  SelectOption,
  StateTaxRate,
  TaxConditionRow,
  TaxRegion,
  TaxRegionState,
  TaxRule,
};

export const taxRuleConditionOptions: SelectOption[] = [
  { title: __('Tax Profile', 'kirki-ecommerce'), value: 'tax_profile' },
  { title: __('Destination', 'kirki-ecommerce'), value: 'destination_region' },
  { title: __('Product Category', 'kirki-ecommerce'), value: 'product_categories' },
];

export const taxRuleActionOptionsArray: SelectOption[] = [
  { title: __('Set Tax Rate', 'kirki-ecommerce'), value: 'set_product_tax_rate' },
  { title: __('Set Shipping Tax Rate', 'kirki-ecommerce'), value: 'set_shipping_tax_rate' },
  { title: __('Tax Exempt', 'kirki-ecommerce'), value: 'set_product_tax_exempt' },
];
