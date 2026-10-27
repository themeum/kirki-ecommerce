import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const Analytics = lazy(() => import('@/features/analytics/pages/analytics'));

const analyticsRoutes: RouteObject[] = [
  {
    path: RouteConfig.Analytics.template,
    element: (
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
    ),
  },
];

export default analyticsRoutes;
