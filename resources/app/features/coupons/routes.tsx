import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';

const Coupons = lazy(() => import('@/features/coupons/pages/coupons'));
const EditCoupon = lazy(() => import('@/features/coupons/pages/edit-coupon/edit-coupon'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {createElement(Component, props)}
  </Suspense>
);

const couponsRoutes: RouteObject[] = [
  { path: RouteConfig.Coupons.template, element: withSuspense(Coupons) },
  { path: RouteConfig.Coupons.get('EditCoupon').template, element: withSuspense(EditCoupon) },
];

export default couponsRoutes;
