import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const WooCommerceMigration = lazy(
  () => import('@/features/migration/pages/woo-commerce-migration'),
);

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => <Suspense fallback={null}>{createElement(Component, props)}</Suspense>;

const migrationRoutes: RouteObject[] = [
  {
    path: RouteConfig.Migration.get('WooCommerce').template,
    element: withSuspense(WooCommerceMigration),
  },
];

export default migrationRoutes;
