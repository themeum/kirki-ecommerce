import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';

const Tags = lazy(() => import('@/features/tags/pages/tags'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {createElement(Component, props)}
  </Suspense>
);

const tagsRoutes: RouteObject[] = [
  { path: RouteConfig.Tags.template, element: withSuspense(Tags) },
];

export default tagsRoutes;
