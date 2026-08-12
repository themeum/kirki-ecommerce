import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';
import UnsavedChangesController from '@/floating-components/unsaved-tracker';
import NotFound from '@/pages/not-found/not-found';
import { __ } from '@/wpi18n';

const Products = lazy(() => import('@/pages/products/products'));
const CreateProduct = lazy(() => import('@/pages/products/create-product/create-product'));
const EditProduct = lazy(() => import('@/pages/products/edit-product/edit-product'));
const BulkEdit = lazy(() => import('@/features/bulk-edit/pages/bulk-edit'));
const Inventory = lazy(() => import('@/features/inventory/pages/inventory'));
const CreateOrder = lazy(() => import('@/pages/orders/order-create/order-create'));
const Orders = lazy(() => import('@/pages/orders/orders'));
const Coupons = lazy(() => import('@/features/coupons/pages/coupons'));
const EditCoupon = lazy(() => import('@/features/coupons/pages/edit-coupon/edit-coupon'));
const OrderDetails = lazy(() => import('@/pages/orders/order-details/order-details'));
const Collections = lazy(() => import('@/features/collections/pages/collections'));
const CollectionDetails = lazy(() => import('@/features/collections/pages/collection-details'));
const Tags = lazy(() => import('@/features/tags/pages/tags'));
const Categories = lazy(() => import('@/features/categories/pages/categories'));
const Brands = lazy(() => import('@/features/brands/pages/brands'));
const Customers = lazy(() => import('@/features/customers/pages/customers'));
const CustomerDetails = lazy(() => import('@/features/customers/pages/customer-details/customer-details'));
const CustomerGroups = lazy(() => import('@/features/customers/pages/customer-groups/customer-groups'));
const SettingsLayout = lazy(() => import('@/pages/settings/settings-layout/settings-layout'));
const GeneralSettings = lazy(() => import('@/pages/settings/general-settings/general-settings'));
const ProductsSettings = lazy(() => import('@/pages/settings/products-settings/products-settings'));
const PaymentSettings = lazy(() => import('@/pages/settings/payment-settings/payment-settings'));
const ShippingSettings = lazy(() => import('@/pages/settings/shipping-settings/shipping-settings'));
const ShippingZone = lazy(() => import('@/pages/settings/shipping-settings/shipping-zone/shipping-zone'));
const TaxSettings = lazy(() => import('@/pages/settings/tax-settings/tax-settings'));
const EmailSettings = lazy(() => import('@/pages/settings/email-settings/email-settings'));
const ShippingDeliveryMethod = lazy(() => import('@/pages/settings/shipping-settings/shipping-method/shipping-delivery-method'));
const MultiCurrencySettings = lazy(() => import('@/pages/settings/multi-currency-settings/multi-currency-settings'));
const CheckoutSettings = lazy(() => import('@/pages/settings/checkout-settings/checkout-settings'));
const EditTemplate = lazy(() => import('@/pages/settings/email-settings/edit-template'));
const GeneralEditRegion = lazy(() => import('@/pages/settings/tax-settings/tax-region/general-edit-region'));
const EditRegionEU = lazy(() => import('@/pages/settings/tax-settings/tax-region/edit-region-eu'));
const EssentialsSettings = lazy(() => import('@/pages/settings/essential-settings/essential-settings'));
const ColorVariation = lazy(() => import('@/pages/settings/essential-settings/variation-library/color-variation'));
const ListVariation = lazy(() => import('@/pages/settings/essential-settings/variation-library/list-variation'));
const AdvancedSettings = lazy(() => import('@/pages/settings/advanced-settings/advanced-settings'));
const ComingSoon = lazy(() => import('@/pages/coming-soon/coming-soon'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {createElement(Component, props)}
  </Suspense>
);

const ProductRoutes = RouteConfig.Products;
const OrderRoutes = RouteConfig.Orders;
const CustomerRoutes = RouteConfig.Customers;
const SettingsRoutes = RouteConfig.Settings;

export const router = createHashRouter([
  {
    element: <UnsavedChangesController />,
    children: [
      { path: RouteConfig.Home.template, element: <Navigate to={ProductRoutes.template} replace /> },
      { path: ProductRoutes.template, element: withSuspense(Products) },
      { path: ProductRoutes.get('CreateProduct').template, element: withSuspense(CreateProduct) },
      { path: ProductRoutes.get('EditProduct').template, element: withSuspense(EditProduct) },
      { path: RouteConfig.BulkVariants.template, element: withSuspense(BulkEdit) },
      { path: RouteConfig.Inventory.template, element: withSuspense(Inventory) },
      { path: RouteConfig.Coupons.template, element: withSuspense(Coupons) },
      { path: RouteConfig.Coupons.get('EditCoupon').template, element: withSuspense(EditCoupon) },
      { path: OrderRoutes.template, element: withSuspense(Orders) },
      { path: OrderRoutes.get('CreateOrder').template, element: withSuspense(CreateOrder) },
      { path: OrderRoutes.get('OrderDetail').template, element: withSuspense(OrderDetails) },
      { path: RouteConfig.Collections.template, element: withSuspense(Collections) },
      {
        path: RouteConfig.Collections.get('CollectionDetail').template,
        element: withSuspense(CollectionDetails),
      },
      { path: RouteConfig.Tags.template, element: withSuspense(Tags) },
      { path: RouteConfig.Categories.template, element: withSuspense(Categories) },
      { path: RouteConfig.Brands.template, element: withSuspense(Brands) },
      { path: CustomerRoutes.template, element: withSuspense(Customers) },
      { path: CustomerRoutes.get('CustomerDetail').template, element: withSuspense(CustomerDetails) },
      { path: CustomerRoutes.get('CustomerGroups').template, element: withSuspense(CustomerGroups) },
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
      { path: '/analytics', element: withSuspense(ComingSoon, { text: __('Analytics', 'kirki-ecommerce') }) },
      { path: '/report', element: withSuspense(ComingSoon, { text: __('Report', 'kirki-ecommerce') }) },
      { path: '/tools', element: withSuspense(ComingSoon, { text: __('Tools', 'kirki-ecommerce') }) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
