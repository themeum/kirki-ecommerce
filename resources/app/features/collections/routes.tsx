import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import { RouteConfig } from '@/config/route-config';

const Collections = lazy(() => import('@/features/collections/pages/collections'));
const CollectionDetails = lazy(() => import('@/features/collections/pages/collection-details'));

const collectionsRoutes: RouteObject[] = [
  { path: RouteConfig.Collections.template, element: withSuspense(Collections) },
  {
    path: RouteConfig.Collections.get('CollectionDetail').template,
    element: withSuspense(CollectionDetails),
  },
];

export default collectionsRoutes;
