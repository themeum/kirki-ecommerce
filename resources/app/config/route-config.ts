import { defineRoute } from '@/libs/route';

export const RouteConfig = {
  Home: defineRoute('/'),
  Onboarding: defineRoute('/onboarding'),

  Products: defineRoute('/products', {
    CreateProduct: defineRoute('/create'),
    EditProduct: defineRoute('/:id'),
  }),
  BulkVariants: defineRoute('/variants/bulk'),
  Inventory: defineRoute('/inventory', {
    EditInventory: defineRoute('/:id'),
  }),

  Coupons: defineRoute('/coupons', {
    EditCoupon: defineRoute('/:id'),
  }),

  Orders: defineRoute('/orders', {
    CreateOrder: defineRoute('/create'),
    OrderDetail: defineRoute('/:id'),
  }),

  Analytics: defineRoute('/analytics'),

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
      ShippingZone: defineRoute('/zone/:zone_id', {
        ShippingDeliveryMethod: defineRoute('/method/:method_id'),
      }),
    }),
    MultiCurrencySettings: defineRoute('/currency'),
    TaxSettings: defineRoute('/tax', {
      EditRegionEU: defineRoute('/region/eu'),
      EditTaxRegion: defineRoute('/region/:code'),
      EditTaxRegionState: defineRoute('/region/:code/:state'),
    }),
    EmailSettings: defineRoute('/email', {
      EditEmailTemplate: defineRoute('/edit-template'),
      EditNotificationTemplate: defineRoute('/:type/:group/:key'),
    }),
    CheckoutSettings: defineRoute('/checkout'),
    EssentialsSettings: defineRoute('/essentials', {
      ColorVariation: defineRoute('/color/:id'),
      ListVariation: defineRoute('/list/:id'),
    }),
    AdvancedSettings: defineRoute('/advanced'),
    LegalSettings: defineRoute('/legal'),
    McpSettings: defineRoute('/mcp', {
      McpAbilities: defineRoute('/abilities'),
    }),
  }),
};
