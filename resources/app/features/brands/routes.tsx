import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import { RouteConfig } from '@/config/route-config';

const Brands = lazy(() => import('@/features/brands/pages/brands'));

const brandsRoutes: RouteObject[] = [
  { path: RouteConfig.Brands.template, element: withSuspense(Brands) },
];

export default brandsRoutes;
