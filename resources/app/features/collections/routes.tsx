import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';

const Collections = lazy(() => import('@/features/collections/pages/collections'));
const CollectionDetails = lazy(() => import('@/features/collections/pages/collection-details'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {createElement(Component, props)}
  </Suspense>
);

const collectionsRoutes: RouteObject[] = [
  { path: RouteConfig.Collections.template, element: withSuspense(Collections) },
  {
    path: RouteConfig.Collections.get('CollectionDetail').template,
    element: withSuspense(CollectionDetails),
  },
];

export default collectionsRoutes;
