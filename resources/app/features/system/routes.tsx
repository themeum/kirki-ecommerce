import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import NotFound from '@/features/system/pages/not-found/not-found';
import { __ } from '@/wpi18n';

const ComingSoon = lazy(() => import('@/features/system/pages/coming-soon/coming-soon'));

const systemRoutes: RouteObject[] = [
  { path: '/analytics', element: withSuspense(ComingSoon, { text: __('Analytics', 'kirki-ecommerce') }) },
  { path: '/report', element: withSuspense(ComingSoon, { text: __('Report', 'kirki-ecommerce') }) },
  { path: '/tools', element: withSuspense(ComingSoon, { text: __('Tools', 'kirki-ecommerce') }) },
  { path: '*', element: <NotFound /> },
];

export default systemRoutes;
