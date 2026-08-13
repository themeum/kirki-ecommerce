import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';

const BulkEdit = lazy(() => import('@/features/bulk-edit/pages/bulk-edit'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {createElement(Component, props)}
  </Suspense>
);

const bulkEditRoutes: RouteObject[] = [
  { path: RouteConfig.BulkVariants.template, element: withSuspense(BulkEdit) },
];

export default bulkEditRoutes;
