import { defineRoute } from '@/libs/route';

export const RouteConfig = {
  Home: defineRoute('/'),

  Products: defineRoute('/products', {
    CreateProduct: defineRoute('/create'),
    EditProduct: defineRoute('/:id'),
  }),
  BulkVariants: defineRoute('/variants/bulk'),
  Inventory: defineRoute('/inventory'),

  Coupons: defineRoute('/coupons', {
    EditCoupon: defineRoute('/:id'),
  }),

  Orders: defineRoute('/orders', {
    CreateOrder: defineRoute('/create'),
    OrderDetail: defineRoute('/:id'),
  }),

  Collections: defineRoute('/collections', {
    CollectionDetail: defineRoute('/:id'),
  }),

  Tags: defineRoute('/tags'),
  Categories: defineRoute('/categories'),
  Brands: defineRoute('/brands'),

  Customers: defineRoute('/customers', {
    CustomerGroups: defineRoute('/groups'),
    CustomerDetail: defineRoute('/:id'),
  }),

  Settings: defineRoute('/settings', {
    GeneralSettings: defineRoute('/general'),
    ProductsSettings: defineRoute('/products'),
    PaymentSettings: defineRoute('/payments'),
    ShippingSettings: defineRoute('/shipping', {
      ShippingZone: defineRoute('/zone/:zone_Id'),
      ShippingDeliveryMethod: defineRoute('/delivery-method'),
    }),
    MultiCurrencySettings: defineRoute('/currency'),
    TaxSettings: defineRoute('/tax', {
      EditRegionEU: defineRoute('/region/eu'),
      EditTaxRegion: defineRoute('/region/:code'),
    }),
    EmailSettings: defineRoute('/email', {
      EditEmailTemplate: defineRoute('/edit-template'),
    }),
    CheckoutSettings: defineRoute('/checkout'),
    EssentialsSettings: defineRoute('/essentials', {
      ColorVariation: defineRoute('/color/:id'),
      ListVariation: defineRoute('/list/:id'),
    }),
    AdvancedSettings: defineRoute('/advanced'),
    LicenseSettings: defineRoute('/license'),
  }),
};
