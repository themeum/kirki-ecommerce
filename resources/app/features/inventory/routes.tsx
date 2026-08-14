import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const Inventory = lazy(() => import('@/features/inventory/pages/inventory'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={null}>
    {createElement(Component, props)}
  </Suspense>
);

const inventoryRoutes: RouteObject[] = [
  { path: RouteConfig.Inventory.template, element: withSuspense(Inventory) },
];

export default inventoryRoutes;
