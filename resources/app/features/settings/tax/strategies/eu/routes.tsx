import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const EditRegionEU = lazy(() => import('./pages/edit-region-eu'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={null}>
    {createElement(Component, props)}
  </Suspense>
);

const TaxSettingsRoutes = RouteConfig.Settings.get('TaxSettings');

export const euRoutes: RouteObject[] = [
  {
    path: TaxSettingsRoutes.get('EditRegionEU').template,
    element: withSuspense(EditRegionEU),
  },
];
