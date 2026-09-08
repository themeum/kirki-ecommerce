import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

import { taxRegionStrategyList } from './registry';

const TaxSettings = lazy(() => import('./pages/tax-settings'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={null}>
    {createElement(Component, props)}
  </Suspense>
);

export const taxRoutes: RouteObject[] = [
  {
    path: RouteConfig.Settings.get('TaxSettings').template,
    element: withSuspense(TaxSettings),
  },
  ...taxRegionStrategyList.flatMap((strategy) => strategy.routes),
];
