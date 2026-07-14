import type { ListFilter, ListQueryParams } from '@/types';

export type QueryParams = ListQueryParams & ListFilter;

export const queryKeys = {
  Products: (params?: QueryParams) => ['Products', params] as const,
  Product: (id: string | number) => ['Product', id] as const,
  Categories: (params?: QueryParams) => ['Categories', params] as const,
  Category: (id: string | number) => ['Category', id] as const,
  Tags: (params?: QueryParams) => ['Tags', params] as const,
  Tag: (id: string | number) => ['Tag', id] as const,
  Brands: (params?: QueryParams) => ['Brands', params] as const,
  Brand: (id: string | number) => ['Brand', id] as const,
  Collections: (params?: QueryParams) => ['Collections', params] as const,
  Collection: (id: string | number) => ['Collection', id] as const,
  Customers: (params?: QueryParams) => ['Customers', params] as const,
  Customer: (id: string | number) => ['Customer', id] as const,
  Attributes: (params?: QueryParams) => ['Attributes', params] as const,
  Attribute: (id: string | number) => ['Attribute', id] as const,
  AttributeValues: (id: string | number, params?: QueryParams) =>
    ['AttributeValues', id, params] as const,
  Inventory: (params?: QueryParams) => ['Inventory', params] as const,
  BulkVariants: (ids: Array<string | number>, params?: QueryParams) =>
    ['BulkVariants', ids, params] as const,
  Countries: (params?: QueryParams) => ['Countries', params] as const,
  Currencies: (params?: QueryParams) => ['Currencies', params] as const,
  CurrenciesList: (params?: QueryParams) =>
    ['CurrenciesList', params] as const,
  AvailableCurrencies: (params?: QueryParams) =>
    ['AvailableCurrencies', params] as const,
  CurrencyProviders: () => ['CurrencyProviders'] as const,
  CurrencyExchangeProviders: () => ['CurrencyExchangeProviders'] as const,
  SchemaProfiles: (params?: QueryParams) =>
    ['SchemaProfiles', params] as const,
  Schemas: (params?: QueryParams) => ['Schemas', params] as const,
  SchemaProfile: (id: string | number) => ['SchemaProfile', id] as const,
  Pages: (params?: QueryParams) => ['Pages', params] as const,
  Settings: (section: string) => ['Settings', section] as const,
  DefaultSettings: () => ['DefaultSettings'] as const,
  ShippingProfiles: (params?: QueryParams) =>
    ['ShippingProfiles', params] as const,
  ShippingBoxes: (params?: QueryParams) => ['ShippingBoxes', params] as const,
  ShippingBox: (id: string | number) => ['ShippingBox', id] as const,
  TaxProfiles: (params?: QueryParams) => ['TaxProfiles', params] as const,
  PaymentGateways: () => ['PaymentGateways'] as const,
  InstallablePaymentGateways: () => ['InstallablePaymentGateways'] as const,
  PaymentGateway: (id: string | number) => ['PaymentGateway', id] as const,
  PaymentMethods: () => ['PaymentMethods'] as const,
};
