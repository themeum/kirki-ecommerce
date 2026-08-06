import type { MediaRef } from '@/types/entities/media';
import type { ProductCurrency } from '@/types/entities/product';

type SettingsSectionKey =
  | 'general'
  | 'product'
  | 'orders'
  | 'checkout'
  | 'shipping'
  | 'tax'
  | 'payment'
  | 'email'
  | 'currency'
  | 'default';

type StoreAddressSettings = {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  zip_code?: string | null;
  country?: string | null;
};

type BarcodeGenerationSettings = {
  data_origin?: string;
  format?: string;
  country_of_origin?: string;
  width?: number;
  height?: number;
  is_human_readable_text_visible?: boolean;
  is_product_name_visible?: boolean;
  is_country_of_origin_visible?: boolean;
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

type ShippingMethodRange = {
  from: number | string;
  to: number | string;
  base_amount: number | string;
};

type ShippingMethod = {
  id: string | number;
  type: string;
  name?: string;
  is_enabled?: boolean;
  zoneId?: string | number;
  base_amount?: number | string;
  is_taxable?: boolean;
  description?: string | null;
  address?: string | null;
  has_fee?: boolean;
  has_pick_time?: boolean;
  pickup_time_start?: string | null;
  pickup_time_end?: string | null;
  ranges?: ShippingMethodRange[];
  is_free_shipping_enabled?: boolean;
  base_free_shipping_min_amount?: number | string;
  shipping_rules?: ShippingRule[];
  shipping_careers?: unknown[];
};

type ShippingZone = {
  id: string | number;
  title: string;
  is_enabled: boolean;
  regions: ShippingRegion[];
  shipping_methods: ShippingMethod[];
  shipping_careers?: unknown[];
};

type PaymentGatewayConfig = Record<
  string,
  string | number | boolean | null | undefined
>;

type PaymentGateway = {
  id: number | string;
  name?: string;
  enabled?: boolean;
  is_enabled?: boolean;
  is_manual?: boolean;
  icon?: string;
  instructions?: string | null;
  config?: PaymentGatewayConfig | null;
};

type PaymentMethod = {
  id: number | string;
  name?: string;
  is_enabled?: boolean;
  instructions?: string | null;
  icon?: string | null;
};

type EmailTemplate = {
  is_enabled?: boolean;
  name?: string;
  subject?: string;
  heading?: string;
  message?: string;
  shortcodes?: string[];
};

type CheckoutConfiguration = {
  address_line_validation?: 'required' | 'optional' | string;
  phone_number_validation?: 'required' | 'optional' | string;
  company_name_validation?: 'required' | 'optional' | string;
  company_id_validation?: 'required' | 'optional' | string;
  vat_identification_number_validation?: 'required' | 'optional' | string;
  has_apply_coupon_code?: boolean;
};

type CurrencyApiConfig = {
  api_key?: string | null;
  update_frequency?: string;
  fallback_behaviour?: string;
  is_cache_enabled?: boolean | null;
};

type TaxRegion = Record<string, string | number | boolean | null | unknown[]>;

type SettingsSectionData = {
  store_name?: string;
  store_email?: string;
  store_logo?: MediaRef | string | number | null;
  store_phone?: string | null;
  store_address?: StoreAddressSettings;
  selling_location_type?: string;
  selling_countries?: string[];
  order_id_prefix?: string | null;
  order_id_suffix?: string | null;
  invoice_id_prefix?: string | null;
  invoice_id_sequence?: string | null;
  invoice_id_suffix?: string | null;
  invoice_counter_reset_schedule?: string | null;
  shop_page?: string | number | null;
  weight_unit?: string;
  dimension_unit?: string;
  display_layout?: string | null;
  is_enabled_reviews?: boolean;
  is_enabled_star_ratings?: boolean;
  is_unit_price_visible?: boolean;
  barcode_generation?: BarcodeGenerationSettings;
  shipping_zones?: ShippingZone[];
  is_tax_inclusive_price?: boolean;
  is_shipping_tax_enabled?: boolean;
  is_enabled_taxed_price?: boolean;
  tax_regions?: TaxRegion[];
  tax_services?: unknown[];
  tax_ids?: unknown[];
  payment_gateways?: PaymentGateway[];
  is_allowed_guest_checkout?: boolean;
  checkout_configuration?: CheckoutConfiguration;
  is_terms_and_conditions_visible?: boolean;
  is_privacy_policy_visible?: boolean;
  terms_and_conditions_content?: string | null;
  privacy_policy_content?: string | null;
  currency_format?: string;
  currency_position?: string;
  thousand_separator?: string;
  decimal_separator?: string;
  is_automatic_update_enabled?: boolean;
  api_provider?: string;
  api_config?: CurrencyApiConfig;
  default_template?: EmailTemplate;
  customer_emails?: Record<string, EmailTemplate>;
  admin_emails?: Record<string, EmailTemplate>;
  base_currency?: ProductCurrency | null;
};

type ShippingProfile = {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
};

type ShippingBox = {
  id: number;
  name?: string;
  description?: string | null;
  width?: number;
  height?: number;
  length?: number;
  unit?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

type TaxProfile = {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
};

export type {
  SettingsSectionKey,
  ShippingRegion,
  ShippingRuleCondition,
  ShippingRuleAction,
  ShippingRule,
  ShippingMethod,
  ShippingZone,
  SettingsSectionData,
  ShippingProfile,
  ShippingBox,
  TaxProfile,
  PaymentGateway,
  PaymentMethod,
};
