import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { createHashRouter, Navigate } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import UnsavedChangesController from '@/floating-components/unsaved-tracker';
import NotFound from '@/pages/not-found/not-found';
import Tryouts from '@/tryouts';

const Products = lazy(() => import('@/pages/products/products'));
const CreateProduct = lazy(() => import('@/pages/products/create-product/create-product'));
const EditProduct = lazy(() => import('@/pages/products/edit-product/edit-product'));
const BulkEdit = lazy(() => import('@/pages/bulk-edit/bulk-edit'));
const Inventory = lazy(() => import('@/pages/inventory/inventory'));
const Orders = lazy(() => import('@/pages/orders/orders'));
const Coupons = lazy(() => import('@/pages/coupons/coupons'));
const EditCoupon = lazy(() => import('@/pages/coupons/edit-coupon/edit-coupon'));
const OrderDetails = lazy(() => import('@/pages/orders/order-details/order-details'));
const Collections = lazy(() => import('@/pages/collections/collections'));
const CollectionDetails = lazy(() => import('@/pages/collections/collection-details/collection-details'));
const Tags = lazy(() => import('@/pages/tags/tags'));
const Categories = lazy(() => import('@/pages/categories/categories'));
const Brands = lazy(() => import('@/pages/brands/brands'));
const Customers = lazy(() => import('@/pages/customers/customers'));
const CustomerDetails = lazy(() => import('@/pages/customers/customer-details/customer-details'));
const CustomerGroups = lazy(() => import('@/pages/customers/customer-groups/customer-groups'));
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
const LicenseSettings = lazy(() => import('@/pages/settings/license-settings/license-settings'));

const withSuspense = (Component: ComponentType): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
);

export const router = createHashRouter([
  {
    element: <UnsavedChangesController />,
    children: [
      { path: '/', element: <Tryouts /> },
      { path: '/products', element: withSuspense(Products) },
      { path: '/products/create', element: withSuspense(CreateProduct) },
      { path: '/products/:id', element: withSuspense(EditProduct) },
      { path: '/variants/bulk', element: withSuspense(BulkEdit) },
      { path: '/inventory', element: withSuspense(Inventory) },
      { path: '/coupons', element: withSuspense(Coupons) },
      { path: '/coupons/:id', element: withSuspense(EditCoupon) },
      { path: '/orders', element: withSuspense(Orders) },
      { path: '/orders/:id', element: withSuspense(OrderDetails) },
      { path: '/collections', element: withSuspense(Collections) },
      { path: '/collections/:id', element: withSuspense(CollectionDetails) },
      { path: '/tags', element: withSuspense(Tags) },
      { path: '/categories', element: withSuspense(Categories) },
      { path: '/brands', element: withSuspense(Brands) },
      { path: '/customers', element: withSuspense(Customers) },
      { path: '/customers/:id', element: withSuspense(CustomerDetails) },
      { path: '/customers/groups', element: withSuspense(CustomerGroups) },
      {
        path: '/settings',
        element: withSuspense(SettingsLayout),
        children: [
          { index: true, element: <Navigate to="/settings/general" replace /> },
          { path: 'general', element: withSuspense(GeneralSettings) },
          { path: 'products', element: withSuspense(ProductsSettings) },
          { path: 'payments', element: withSuspense(PaymentSettings) },
          { path: 'shipping', element: withSuspense(ShippingSettings) },
          { path: 'shipping/zone/:zone_Id', element: withSuspense(ShippingZone) },
          { path: 'shipping/delivery-method', element: withSuspense(ShippingDeliveryMethod) },
          {
            path: 'shipping/delivery-method/:methodId/:zoneId',
            element: withSuspense(ShippingDeliveryMethod),
          },
          { path: 'currency', element: withSuspense(MultiCurrencySettings) },
          { path: 'tax', element: withSuspense(TaxSettings) },
          { path: 'tax/region/eu', element: withSuspense(EditRegionEU) },
          { path: 'tax/region/:code', element: withSuspense(GeneralEditRegion) },
          { path: 'email', element: withSuspense(EmailSettings) },
          { path: 'checkout', element: withSuspense(CheckoutSettings) },
          { path: 'email/edit-template', element: withSuspense(EditTemplate) },
          { path: 'essentials', element: withSuspense(EssentialsSettings) },
          { path: 'essentials/color/:id', element: withSuspense(ColorVariation) },
          { path: 'essentials/list/:id', element: withSuspense(ListVariation) },
          { path: 'advanced', element: withSuspense(AdvancedSettings) },
          { path: 'license', element: withSuspense(LicenseSettings) },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
