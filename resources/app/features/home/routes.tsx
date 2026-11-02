import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const Home = lazy(() => import('@/features/home/pages/home'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => <Suspense fallback={null}>{createElement(Component, props)}</Suspense>;

const homeRoutes: RouteObject[] = [
  { path: RouteConfig.Home.template, element: withSuspense(Home) },
];

export default homeRoutes;
