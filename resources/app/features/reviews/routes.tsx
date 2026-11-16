import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const Reviews = lazy(() => import('@/features/reviews/pages/reviews'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={null}>
    {createElement(Component, props)}
  </Suspense>
);

const reviewsRoutes: RouteObject[] = [
  { path: RouteConfig.Reviews.template, element: withSuspense(Reviews) },
];

export default reviewsRoutes;
