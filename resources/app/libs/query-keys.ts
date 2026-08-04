import type { ListParams, ListQueryParams } from '@/types';
import { CouponListFilter } from '@/types/filters/coupon';
import { ProductListFilter } from '@/types/filters/product';

export const queryKeys = {
  Products: (params?: ListParams<ProductListFilter>) =>
    ['Products', params] as const,
  Product: (id: string | number) => ['Product', id] as const,
  Categories: (params?: ListQueryParams) => ['Categories', params] as const,
  Category: (id: string | number) => ['Category', id] as const,
  Tags: (params?: ListQueryParams) => ['Tags', params] as const,
  Tag: (id: string | number) => ['Tag', id] as const,
  Brands: (params?: ListQueryParams) => ['Brands', params] as const,
  Brand: (id: string | number) => ['Brand', id] as const,
  Collections: (params?: ListQueryParams) =>
    ['Collections', params] as const,
  Collection: (id: string | number) => ['Collection', id] as const,
  Customers: (params?: ListQueryParams) => ['Customers', params] as const,
  Customer: (id: string | number) => ['Customer', id] as const,
  Attributes: (params?: ListQueryParams) => ['Attributes', params] as const,
  Attribute: (id: string | number) => ['Attribute', id] as const,
  AttributeValues: (id: string | number, params?: ListQueryParams) =>
    ['AttributeValues', id, params] as const,
  Inventory: (params?: ListQueryParams) => ['Inventory', params] as const,
  BulkVariants: (ids: Array<string | number>, params?: ListQueryParams) =>
    ['BulkVariants', ids, params] as const,
  Countries: (params?: ListQueryParams) => ['Countries', params] as const,
  Currencies: (params?: ListQueryParams) => ['Currencies', params] as const,
  CurrenciesList: (params?: ListQueryParams) =>
    ['CurrenciesList', params] as const,
  AvailableCurrencies: (params?: ListQueryParams) =>
    ['AvailableCurrencies', params] as const,
  CurrencyProviders: () => ['CurrencyProviders'] as const,
  CurrencyExchangeProviders: () => ['CurrencyExchangeProviders'] as const,
  SchemaProfiles: (params?: ListQueryParams) =>
    ['SchemaProfiles', params] as const,
  Schemas: (params?: ListQueryParams) => ['Schemas', params] as const,
  SchemaProfile: (id: string | number) => ['SchemaProfile', id] as const,
  Pages: (params?: ListQueryParams) => ['Pages', params] as const,
  Settings: (section: string) => ['Settings', section] as const,
  DefaultSettings: () => ['DefaultSettings'] as const,
  ShippingProfiles: (params?: ListQueryParams) =>
    ['ShippingProfiles', params] as const,
  ShippingBoxes: (params?: ListQueryParams) =>
    ['ShippingBoxes', params] as const,
  ShippingBox: (id: string | number) => ['ShippingBox', id] as const,
  TaxProfiles: (params?: ListQueryParams) =>
    ['TaxProfiles', params] as const,
  PaymentGateways: () => ['PaymentGateways'] as const,
  InstallablePaymentGateways: () => ['InstallablePaymentGateways'] as const,
  PaymentGateway: (id: string | number) => ['PaymentGateway', id] as const,
  PaymentMethods: () => ['PaymentMethods'] as const,
  Coupons: (params?: ListParams<CouponListFilter>) => params ? ['Coupons', params] as const : ['Coupons'] as const,
  Coupon: (id: string | number) => ['Coupon', id] as const,
};
