import { describe, expect, it } from 'vitest';

import { RouteConfig } from '@/config/route-config';
import { defineRoute } from '@/libs/route';

describe('defineRoute', () => {
  it('builds a leaf route without children', () => {
    const route = defineRoute('/inventory');

    expect(route.template).toBe('/inventory');
    expect(route.buildLink()).toBe('/inventory');
    expect(route.children).toEqual({});
  });

  it('prefixes a child template with the parent template', () => {
    const route = defineRoute('/products', {
      CreateProduct: defineRoute('/create'),
    });

    expect(route.get('CreateProduct').template).toBe('/products/create');
    expect(route.get('CreateProduct').buildLink()).toBe('/products/create');
  });

  it('resolves get() to the same node the children map holds', () => {
    const route = defineRoute('/products', {
      CreateProduct: defineRoute('/create'),
    });

    expect(route.get('CreateProduct')).toBe(route.children.CreateProduct);
  });

  it('composes templates through nested levels', () => {
    const route = defineRoute('/settings', {
      TaxSettings: defineRoute('/tax', {
        EditTaxRegion: defineRoute('/region/:code'),
      }),
    });

    expect(route.get('TaxSettings').template).toBe('/settings/tax');
    expect(route.get('TaxSettings').get('EditTaxRegion').buildLink({ code: 'US' })).toBe(
      '/settings/tax/region/US',
    );
  });

  it('inherits params from the parent template', () => {
    const route = defineRoute('/products/:id', {
      Variants: defineRoute('/variants'),
    });

    expect(route.get('Variants').buildLink({ id: 12 })).toBe('/products/12/variants');
  });

  it('leaves the parent untouched when it is nested elsewhere', () => {
    const taxSettings = defineRoute('/tax', {
      EditRegionEU: defineRoute('/region/eu'),
    });
    const settings = defineRoute('/settings', { TaxSettings: taxSettings });

    expect(taxSettings.template).toBe('/tax');
    expect(taxSettings.get('EditRegionEU').template).toBe('/tax/region/eu');
    expect(settings.get('TaxSettings').get('EditRegionEU').template).toBe(
      '/settings/tax/region/eu',
    );
  });
});

describe('RouteConfig', () => {
  it('resolves the documented templates', () => {
    expect(RouteConfig.Products.get('EditProduct').template).toBe('/products/:id');
    expect(RouteConfig.Customers.get('CustomerGroups').template).toBe('/customers/groups');
    expect(RouteConfig.Settings.get('GeneralSettings').template).toBe('/settings/general');
    expect(RouteConfig.Settings.get('ShippingSettings').get('ShippingZone').template).toBe(
      '/settings/shipping/zone/:zone_Id',
    );
    expect(RouteConfig.Settings.get('EssentialsSettings').get('ListVariation').template).toBe(
      '/settings/essentials/list/:id',
    );
  });

  it('builds links with params', () => {
    expect(RouteConfig.Orders.get('OrderDetail').buildLink({ id: 42 })).toBe('/orders/42');
    expect(
      RouteConfig.Settings.get('TaxSettings').get('EditTaxRegion').buildLink({ code: 'EU' }),
    ).toBe('/settings/tax/region/EU');
  });
});
