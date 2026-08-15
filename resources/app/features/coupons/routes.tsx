import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import { RouteConfig } from '@/config/route-config';

const Coupons = lazy(() => import('@/features/coupons/pages/coupons'));
const EditCoupon = lazy(() => import('@/features/coupons/pages/edit-coupon/edit-coupon'));

const couponsRoutes: RouteObject[] = [
  { path: RouteConfig.Coupons.template, element: withSuspense(Coupons) },
  { path: RouteConfig.Coupons.get('EditCoupon').template, element: withSuspense(EditCoupon) },
];

export default couponsRoutes;
