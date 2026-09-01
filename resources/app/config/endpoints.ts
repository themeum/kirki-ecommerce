export const endpoints = {
  PRODUCTS: '/products',
  PRODUCT: (id: string | number) => `/products/${id}`,
  PRODUCTS_BULK: '/products/bulk',
  PRODUCT_VARIANTS: '/product-variants',
  PRODUCT_DUPLICATE: (id: string | number) => `/products/${id}/duplicate`,

  CATEGORIES: '/categories',
  CATEGORY: (id: string | number) => `/categories/${id}`,
  CATEGORIES_BULK: '/categories/bulk',

  TAGS: '/tags',
  TAG: (id: string | number) => `/tags/${id}`,
  TAGS_BULK: '/tags/bulk',

  BRANDS: '/brands',
  BRAND: (id: string | number) => `/brands/${id}`,
  BRANDS_BULK: '/brands/bulk',

  COLLECTIONS: '/collections',
  COLLECTION: (id: string | number) => `/collections/${id}`,
  COLLECTIONS_BULK: '/collections/bulk',

  CUSTOMERS: '/customers',
  CUSTOMER: (id: string | number) => `/customers/${id}`,
  CUSTOMERS_BULK: '/customers/bulk',

  ATTRIBUTES: '/attributes',
  ATTRIBUTE: (id: string | number) => `/attributes/${id}`,
  ATTRIBUTE_VALUES: (id: string | number) => `/attributes/${id}/values`,
  ATTRIBUTE_VALUE: (attributeId: string | number, valueId: string | number) =>
    `/attributes/${attributeId}/values/${valueId}`,
  ATTRIBUTE_VALUES_BULK: (attributeId: string | number) => `/attributes/${attributeId}/values/bulk`,

  VARIANTS: '/variants',
  VARIANTS_BULK: '/variants/bulk',
  VARIANTS_BULK_BY_IDS: (ids: string | (string | number)[]) =>
    `/variants/bulk/${Array.isArray(ids) ? ids.join(',') : ids}`,

  COUNTRIES: '/countries',

  CURRENCIES: '/currencies',
  CURRENCY: (id: string | number) => `/currencies/${id}`,
  CURRENCIES_LIST: '/currencies/list',
  CURRENCY_PROVIDERS: '/currency-exchange/providers',
  CURRENCY_EXCHANGE_PROVIDERS: '/currency-exchange/providers',

  PRODUCT_SCHEMAS: '/product-schemas',
  PRODUCT_SCHEMA: (id: string | number) => `/product-schemas/${id}`,

  COUPONS: '/coupons',
  COUPON: (id: string | number) => `/coupons/${id}`,
  COUPON_ACTION: (id: string | number) => `/coupons/${id}/action`,
  COUPONS_BULK: '/coupons/bulk',

  PAGES: '/pages',

  SETTINGS: '/settings',
  SETTINGS_SECTION: (key: string) => `/settings/${key}`,
  SETTINGS_BY_KEY: (key: string) => `/settings/${key}`,
  APP_CONFIG: '/app-config',

  SHIPPING_PROFILES: '/shipping-profiles',
  SHIPPING_PROFILE: (id: string | number) => `/shipping-profiles/${id}`,
  SHIPPING_BOXES: '/shipping-boxes',
  SHIPPING_BOX: (id: string | number) => `/shipping-boxes/${id}`,

  TAX_PROFILES: '/tax-profiles',
  TAX_PROFILE: (id: string | number) => `/tax-profiles/${id}`,

  ONLINE_PAYMENTS: '/online-payments',
  ONLINE_PAYMENT: (id: string | number) => `/online-payments/${id}`,
  ONLINE_PAYMENTS_INSTALLABLE: '/online-payments/installable',
  ONLINE_PAYMENTS_INSTALL: '/online-payments/install',
  OFFLINE_PAYMENTS: '/offline-payments',
  OFFLINE_PAYMENT: (id: string | number) => `/offline-payments/${id}`,

  ORDER: (id: string | number) => `/orders/${id}`,
  ORDER_ACTION: (id: string | number) => `/orders/${id}/action`,
  ORDERS: '/orders',
  CALCULATE_ORDER: '/calculate/order',
  ORDER_ACTIVITIES: (orderId: string | number) => `/orders/${orderId}/activities`,
  ORDER_ACTIVITY: (orderId: string | number, activityId: string | number) => `/orders/${orderId}/activities/${activityId}`,
} as const;
