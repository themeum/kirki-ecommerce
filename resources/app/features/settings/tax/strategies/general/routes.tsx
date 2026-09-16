import type { ReactNode } from 'react';
import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';
import GeneralTaxRegionSkeleton from '@/features/settings/tax/strategies/general/skeletons/general-tax-region-skeleton';
import GeneralTaxRegionStateSkeleton from '@/features/settings/tax/strategies/general/skeletons/general-tax-region-state-skeleton';

const GeneralEditRegion = lazy(() => import('./pages/general-edit-region'));
const GeneralEditRegionState = lazy(() => import('./pages/general-edit-region-state'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  skeleton: ReactNode = null,
  props = {} as Props,
): ReactElement => <Suspense fallback={skeleton}>{createElement(Component, props)}</Suspense>;

const TaxSettingsRoutes = RouteConfig.Settings.get('TaxSettings');

export const generalRoutes: RouteObject[] = [
  {
    path: TaxSettingsRoutes.get('EditTaxRegion').template,
    element: withSuspense(GeneralEditRegion, <GeneralTaxRegionSkeleton />),
  },
  {
    path: TaxSettingsRoutes.get('EditTaxRegionState').template,
    element: withSuspense(GeneralEditRegionState, <GeneralTaxRegionStateSkeleton />),
  },
];
