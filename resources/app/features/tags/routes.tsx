import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import { RouteConfig } from '@/config/route-config';

const Tags = lazy(() => import('@/features/tags/pages/tags'));

const tagsRoutes: RouteObject[] = [
  { path: RouteConfig.Tags.template, element: withSuspense(Tags) },
];

export default tagsRoutes;
