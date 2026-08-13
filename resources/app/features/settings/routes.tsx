import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Navigate } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';

const SettingsLayout = lazy(() => import('@/features/settings/pages/settings-layout'));
const GeneralSettings = lazy(() => import('@/features/settings/general/pages/general-settings'));
const ProductsSettings = lazy(() => import('@/features/settings/products/pages/products-settings'));
const PaymentSettings = lazy(() => import('@/features/settings/payment/pages/payment-settings'));
const ShippingSettings = lazy(() => import('@/features/settings/shipping/pages/shipping-settings'));
const ShippingZone = lazy(() => import('@/features/settings/shipping/pages/shipping-zone/shipping-zone'));
const TaxSettings = lazy(() => import('@/features/settings/tax/pages/tax-settings'));
const EmailSettings = lazy(() => import('@/features/settings/email/pages/email-settings'));
const ShippingDeliveryMethod = lazy(() => import('@/features/settings/shipping/pages/shipping-method/shipping-delivery-method'));
const MultiCurrencySettings = lazy(() => import('@/features/settings/multi-currency/pages/multi-currency-settings'));
const CheckoutSettings = lazy(() => import('@/features/settings/checkout/pages/checkout-settings'));
const EditTemplate = lazy(() => import('@/features/settings/email/pages/edit-template'));
const GeneralEditRegion = lazy(() => import('@/features/settings/tax/pages/tax-region/general-edit-region'));
const EditRegionEU = lazy(() => import('@/features/settings/tax/pages/tax-region/edit-region-eu'));
const EssentialsSettings = lazy(() => import('@/features/settings/essentials/pages/essential-settings'));
const ColorVariation = lazy(() => import('@/features/settings/essentials/pages/variation-library/color-variation'));
const ListVariation = lazy(() => import('@/features/settings/essentials/pages/variation-library/list-variation'));
const AdvancedSettings = lazy(() => import('@/features/settings/advanced/pages/advanced-settings'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {createElement(Component, props)}
  </Suspense>
);

const SettingsRoutes = RouteConfig.Settings;

const settingsRoutes: RouteObject[] = [
  {
    path: SettingsRoutes.template,
    element: withSuspense(SettingsLayout),
    children: [
      {
        index: true,
        element: <Navigate to={SettingsRoutes.get('GeneralSettings').buildLink()} replace />,
      },
      { path: SettingsRoutes.get('GeneralSettings').template, element: withSuspense(GeneralSettings) },
      {
        path: SettingsRoutes.get('ProductsSettings').template,
        element: withSuspense(ProductsSettings),
      },
      { path: SettingsRoutes.get('PaymentSettings').template, element: withSuspense(PaymentSettings) },
      {
        path: SettingsRoutes.get('ShippingSettings').template,
        element: withSuspense(ShippingSettings),
      },
      {
        path: SettingsRoutes.get('ShippingSettings').get('ShippingZone').template,
        element: withSuspense(ShippingZone),
      },
      {
        path: SettingsRoutes.get('ShippingSettings').get('ShippingDeliveryMethod').template,
        element: withSuspense(ShippingDeliveryMethod),
      },
      {
        path: SettingsRoutes.get('MultiCurrencySettings').template,
        element: withSuspense(MultiCurrencySettings),
      },
      { path: SettingsRoutes.get('TaxSettings').template, element: withSuspense(TaxSettings) },
      {
        path: SettingsRoutes.get('TaxSettings').get('EditRegionEU').template,
        element: withSuspense(EditRegionEU),
      },
      {
        path: SettingsRoutes.get('TaxSettings').get('EditTaxRegion').template,
        element: withSuspense(GeneralEditRegion),
      },
      { path: SettingsRoutes.get('EmailSettings').template, element: withSuspense(EmailSettings) },
      {
        path: SettingsRoutes.get('CheckoutSettings').template,
        element: withSuspense(CheckoutSettings),
      },
      {
        path: SettingsRoutes.get('EmailSettings').get('EditEmailTemplate').template,
        element: withSuspense(EditTemplate),
      },
      {
        path: SettingsRoutes.get('EssentialsSettings').template,
        element: withSuspense(EssentialsSettings),
      },
      {
        path: SettingsRoutes.get('EssentialsSettings').get('ColorVariation').template,
        element: withSuspense(ColorVariation),
      },
      {
        path: SettingsRoutes.get('EssentialsSettings').get('ListVariation').template,
        element: withSuspense(ListVariation),
      },
      {
        path: SettingsRoutes.get('AdvancedSettings').template,
        element: withSuspense(AdvancedSettings),
      },
    ],
  },
];

export default settingsRoutes;
