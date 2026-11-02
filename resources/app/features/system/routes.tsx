import type { RouteObject } from 'react-router';

import NotFound from '@/features/system/pages/not-found/not-found';

const systemRoutes: RouteObject[] = [
  { path: '*', element: <NotFound /> },
];

export default systemRoutes;
