import type { ReactNode } from 'react';
import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Navigate } from 'react-router';

import { RouteConfig } from '@/config/route-config';
import CheckoutSettingsSkeleton from '@/features/settings/checkout/skeletons/checkout-settings-skeleton';
import EditTemplateSkeleton from '@/features/settings/email/skeletons/edit-template-skeleton';
import EmailSettingsSkeleton from '@/features/settings/email/skeletons/email-settings-skeleton';
import EssentialsSettingsSkeleton from '@/features/settings/essentials/skeletons/essentials-settings-skeleton';
import VariationDetailSkeleton from '@/features/settings/essentials/skeletons/variation-detail-skeleton';
import GeneralSettingsSkeleton from '@/features/settings/general/skeletons/general-settings-skeleton';
import MultiCurrencySettingsSkeleton from '@/features/settings/multi-currency/skeletons/multi-currency-settings-skeleton';
import PaymentSettingsSkeleton from '@/features/settings/payment/skeletons/payment-settings-skeleton';
import ProductsSettingsSkeleton from '@/features/settings/products/skeletons/products-settings-skeleton';
import ShippingDeliveryMethodSkeleton from '@/features/settings/shipping/skeletons/shipping-delivery-method-skeleton';
import ShippingSettingsSkeleton from '@/features/settings/shipping/skeletons/shipping-settings-skeleton';
import ShippingZoneSkeleton from '@/features/settings/shipping/skeletons/shipping-zone-skeleton';
import { taxRoutes } from '@/features/settings/tax/routes';
import TaxSettingsSkeleton from '@/features/settings/tax/shared/skeletons/tax-settings-skeleton';

const SettingsLayout = lazy(() => import('@/features/settings/pages/settings-layout'));
const GeneralSettings = lazy(() => import('@/features/settings/general/pages/general-settings'));
const ProductsSettings = lazy(() => import('@/features/settings/products/pages/products-settings'));
const PaymentSettings = lazy(() => import('@/features/settings/payment/pages/payment-settings'));
const ShippingSettings = lazy(() => import('@/features/settings/shipping/pages/shipping-settings'));
const ShippingZone = lazy(
  () => import('@/features/settings/shipping/pages/shipping-zone/shipping-zone'),
);
const TaxSettings = lazy(() => import('@/features/settings/tax/pages/tax-settings'));
const EmailSettings = lazy(() => import('@/features/settings/email/pages/email-settings'));
const ShippingDeliveryMethod = lazy(
  () => import('@/features/settings/shipping/pages/shipping-method/shipping-delivery-method'),
);
const MultiCurrencySettings = lazy(
  () => import('@/features/settings/multi-currency/pages/multi-currency-settings'),
);
const CheckoutSettings = lazy(() => import('@/features/settings/checkout/pages/checkout-settings'));
const EditTemplate = lazy(() => import('@/features/settings/email/pages/edit-template'));
const EssentialsSettings = lazy(
  () => import('@/features/settings/essentials/pages/essential-settings'),
);
const ColorVariation = lazy(
  () => import('@/features/settings/essentials/pages/variation-library/color-variation'),
);
const ListVariation = lazy(
  () => import('@/features/settings/essentials/pages/variation-library/list-variation'),
);
const AdvancedSettings = lazy(() => import('@/features/settings/advanced/pages/advanced-settings'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  skeleton: ReactNode = null,
  props = {} as Props,
): ReactElement => {
  return <Suspense fallback={skeleton}>{createElement(Component, props)}</Suspense>;
};

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
      {
        path: SettingsRoutes.get('GeneralSettings').template,
        element: withSuspense(GeneralSettings, <GeneralSettingsSkeleton />),
      },
      {
        path: SettingsRoutes.get('ProductsSettings').template,
        element: withSuspense(ProductsSettings, <ProductsSettingsSkeleton />),
      },
      {
        path: SettingsRoutes.get('PaymentSettings').template,
        element: withSuspense(PaymentSettings, <PaymentSettingsSkeleton />),
      },
      {
        path: SettingsRoutes.get('ShippingSettings').template,
        element: withSuspense(ShippingSettings, <ShippingSettingsSkeleton />),
      },
      {
        path: SettingsRoutes.get('ShippingSettings').get('ShippingZone').template,
        element: withSuspense(ShippingZone, <ShippingZoneSkeleton />),
      },
      {
        path: SettingsRoutes.get('ShippingSettings').get('ShippingDeliveryMethod').template,
        element: withSuspense(ShippingDeliveryMethod, <ShippingDeliveryMethodSkeleton />),
      },
      {
        path: SettingsRoutes.get('MultiCurrencySettings').template,
        element: withSuspense(MultiCurrencySettings, <MultiCurrencySettingsSkeleton />),
      },
      {
        path: SettingsRoutes.get('TaxSettings').template,
        element: withSuspense(TaxSettings, <TaxSettingsSkeleton />),
      },
      ...taxRoutes,
      {
        path: SettingsRoutes.get('EmailSettings').template,
        element: withSuspense(EmailSettings, <EmailSettingsSkeleton />),
      },
      {
        path: SettingsRoutes.get('CheckoutSettings').template,
        element: withSuspense(CheckoutSettings, <CheckoutSettingsSkeleton />),
      },
      {
        path: SettingsRoutes.get('EmailSettings').get('EditEmailTemplate').template,
        element: withSuspense(EditTemplate, <EditTemplateSkeleton />),
      },
      {
        path: SettingsRoutes.get('EssentialsSettings').template,
        element: withSuspense(EssentialsSettings, <EssentialsSettingsSkeleton />),
      },
      {
        path: SettingsRoutes.get('EssentialsSettings').get('ColorVariation').template,
        element: withSuspense(ColorVariation, <VariationDetailSkeleton />),
      },
      {
        path: SettingsRoutes.get('EssentialsSettings').get('ListVariation').template,
        element: withSuspense(ListVariation, <VariationDetailSkeleton />),
      },
      {
        path: SettingsRoutes.get('AdvancedSettings').template,
        element: withSuspense(AdvancedSettings),
      },
    ],
  },
];

export default settingsRoutes;
