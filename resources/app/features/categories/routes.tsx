import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const Categories = lazy(() => import('@/features/categories/pages/categories'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={null}>
    {createElement(Component, props)}
  </Suspense>
);

const categoriesRoutes: RouteObject[] = [
  { path: RouteConfig.Categories.template, element: withSuspense(Categories) },
];

export default categoriesRoutes;
