import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';

const Brands = lazy(() => import('@/features/brands/pages/brands'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {createElement(Component, props)}
  </Suspense>
);

const brandsRoutes: RouteObject[] = [
  { path: RouteConfig.Brands.template, element: withSuspense(Brands) },
];

export default brandsRoutes;
