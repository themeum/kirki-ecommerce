import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';
import ordersRoutes from '@/features/orders/routes';
import productsRoutes from '@/features/products/routes';
import settingsRoutes from '@/features/settings/routes';
import UnsavedChangesController from '@/floating-components/unsaved-tracker';
import NotFound from '@/pages/not-found/not-found';
import { __ } from '@/wpi18n';

const BulkEdit = lazy(() => import('@/features/bulk-edit/pages/bulk-edit'));
const Inventory = lazy(() => import('@/features/inventory/pages/inventory'));
const Coupons = lazy(() => import('@/features/coupons/pages/coupons'));
const EditCoupon = lazy(() => import('@/features/coupons/pages/edit-coupon/edit-coupon'));
const Collections = lazy(() => import('@/features/collections/pages/collections'));
const CollectionDetails = lazy(() => import('@/features/collections/pages/collection-details'));
const Tags = lazy(() => import('@/features/tags/pages/tags'));
const Categories = lazy(() => import('@/features/categories/pages/categories'));
const Brands = lazy(() => import('@/features/brands/pages/brands'));
const Customers = lazy(() => import('@/features/customers/pages/customers'));
const CustomerDetails = lazy(() => import('@/features/customers/pages/customer-details/customer-details'));
const CustomerGroups = lazy(() => import('@/features/customers/pages/customer-groups/customer-groups'));
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
const CustomerRoutes = RouteConfig.Customers;

export const router = createHashRouter([
  {
    element: <UnsavedChangesController />,
    children: [
      { path: RouteConfig.Home.template, element: <Navigate to={ProductRoutes.template} replace /> },
      ...productsRoutes,
      { path: RouteConfig.BulkVariants.template, element: withSuspense(BulkEdit) },
      { path: RouteConfig.Inventory.template, element: withSuspense(Inventory) },
      { path: RouteConfig.Coupons.template, element: withSuspense(Coupons) },
      { path: RouteConfig.Coupons.get('EditCoupon').template, element: withSuspense(EditCoupon) },
      ...ordersRoutes,
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
      ...settingsRoutes,
      { path: '/analytics', element: withSuspense(ComingSoon, { text: __('Analytics', 'kirki-ecommerce') }) },
      { path: '/report', element: withSuspense(ComingSoon, { text: __('Report', 'kirki-ecommerce') }) },
      { path: '/tools', element: withSuspense(ComingSoon, { text: __('Tools', 'kirki-ecommerce') }) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
