import type { ListQueryParams } from '@/types/list-state';

const shippingKeys = {
  profiles: {
    all: ['ShippingProfiles'] as const,
    list: (params?: ListQueryParams) => [...shippingKeys.profiles.all, params] as const,
  },
  boxes: {
    all: ['ShippingBoxes'] as const,
    lists: () => [...shippingKeys.boxes.all, 'list'] as const,
    list: (params?: ListQueryParams) => [...shippingKeys.boxes.lists(), params] as const,
    details: () => [...shippingKeys.boxes.all, 'detail'] as const,
    detail: (id: string | number) => [...shippingKeys.boxes.details(), String(id)] as const,
  },
};

const taxKeys = {
  all: ['TaxProfiles'] as const,
  list: (params?: ListQueryParams) => [...taxKeys.all, params] as const,
};

const currencyKeys = {
  all: ['Currencies'] as const,
  list: (params?: ListQueryParams) => [...currencyKeys.all, params] as const,
  optionsAll: ['CurrenciesList'] as const,
  options: (params?: ListQueryParams) => [...currencyKeys.optionsAll, params] as const,
  exchangeProviders: () => ['CurrencyExchangeProviders'] as const,
  providers: () => ['CurrencyProviders'] as const,
};

const paymentKeys = {
  online: {
    all: ['OnlinePayments'] as const,
  },
  onlineDetail: (id: string | number) => ['OnlinePayment', id] as const,
  installableOnline: () => ['InstallableOnlinePayments'] as const,
  offline: {
    all: ['OfflinePayments'] as const,
  },
};

const schemaProfileKeys = {
  all: ['Schemas'] as const,
  lists: () => [...schemaProfileKeys.all, 'list'] as const,
  list: (params?: ListQueryParams) => [...schemaProfileKeys.lists(), params] as const,
};

export {
  currencyKeys, paymentKeys, schemaProfileKeys, shippingKeys, taxKeys,
};
