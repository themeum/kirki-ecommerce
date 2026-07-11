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

type SettingsSectionData = Record<string, unknown>;

type SettingsSection = {
  loaded: boolean;
  data: SettingsSectionData | null;
};

type ShippingProfile = {
  id: number;
  name: string;
  [key: string]: unknown;
};

type ShippingBox = {
  id: number;
  name?: string;
  [key: string]: unknown;
};

type TaxProfile = {
  id: number;
  name: string;
  [key: string]: unknown;
};

type NestedListState<T> = {
  loaded: boolean;
  data: T[] | null;
  toggler: boolean | number;
};

type ShippingSettingsSection = SettingsSection & {
  activeZoneId: number | null;
  selectedCountryList: unknown;
  shippingProfile: NestedListState<ShippingProfile>;
  shippingBox: NestedListState<ShippingBox>;
};

type TaxSettingsSection = SettingsSection & {
  taxProfile: NestedListState<TaxProfile>;
};

type SettingsState = {
  general: SettingsSection;
  product: SettingsSection;
  orders: SettingsSection;
  checkout: SettingsSection;
  shipping: ShippingSettingsSection;
  tax: TaxSettingsSection;
  payment: SettingsSection;
  email: SettingsSection;
  currency: SettingsSection;
  default: SettingsSection;
};

type SetSettingsPayload = {
  key: SettingsSectionKey;
  value: SettingsSectionData | null;
};

type PaymentGateway = {
  id: number;
  name?: string;
  enabled?: boolean;
  [key: string]: unknown;
};

type PaymentMethod = {
  id: number;
  name?: string;
  [key: string]: unknown;
};

export type {
  SettingsSectionKey,
  SettingsSectionData,
  SettingsSection,
  ShippingProfile,
  ShippingBox,
  TaxProfile,
  NestedListState,
  ShippingSettingsSection,
  TaxSettingsSection,
  SettingsState,
  SetSettingsPayload,
  PaymentGateway,
  PaymentMethod,
};
