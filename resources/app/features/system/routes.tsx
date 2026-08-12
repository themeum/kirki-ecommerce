import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import NotFound from '@/features/system/pages/not-found/not-found';
import { __ } from '@/wpi18n';

const ComingSoon = lazy(() => import('@/features/system/pages/coming-soon/coming-soon'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {createElement(Component, props)}
  </Suspense>
);

const systemRoutes: RouteObject[] = [
  { path: '/analytics', element: withSuspense(ComingSoon, { text: __('Analytics', 'kirki-ecommerce') }) },
  { path: '/report', element: withSuspense(ComingSoon, { text: __('Report', 'kirki-ecommerce') }) },
  { path: '/tools', element: withSuspense(ComingSoon, { text: __('Tools', 'kirki-ecommerce') }) },
  { path: '*', element: <NotFound /> },
];

export default systemRoutes;
