import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import { RouteConfig } from '@/config/route-config';

const Inventory = lazy(() => import('@/features/inventory/pages/inventory'));

const inventoryRoutes: RouteObject[] = [
  { path: RouteConfig.Inventory.template, element: withSuspense(Inventory) },
];

export default inventoryRoutes;
