import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import { RouteConfig } from '@/config/route-config';

const Categories = lazy(() => import('@/features/categories/pages/categories'));

const categoriesRoutes: RouteObject[] = [
  { path: RouteConfig.Categories.template, element: withSuspense(Categories) },
];

export default categoriesRoutes;
