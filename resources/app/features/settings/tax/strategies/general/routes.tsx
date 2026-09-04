import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const GeneralEditRegion = lazy(() => import('./pages/general-edit-region'));
const GeneralEditRegionState = lazy(() => import('./pages/general-edit-region-state'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={null}>
    {createElement(Component, props)}
  </Suspense>
);

const TaxSettingsRoutes = RouteConfig.Settings.get('TaxSettings');

export const generalRoutes: RouteObject[] = [
  {
    path: TaxSettingsRoutes.get('EditTaxRegion').template,
    element: withSuspense(GeneralEditRegion),
  },
  {
    path: TaxSettingsRoutes.get('EditTaxRegionState').template,
    element: withSuspense(GeneralEditRegionState),
  },
];
