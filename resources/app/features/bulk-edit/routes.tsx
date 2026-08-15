import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import { RouteConfig } from '@/config/route-config';

const BulkEdit = lazy(() => import('@/features/bulk-edit/pages/bulk-edit'));

const bulkEditRoutes: RouteObject[] = [
  { path: RouteConfig.BulkVariants.template, element: withSuspense(BulkEdit) },
];

export default bulkEditRoutes;
