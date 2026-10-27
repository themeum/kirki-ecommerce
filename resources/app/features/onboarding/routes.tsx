import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const Onboarding = lazy(() => import('@/features/onboarding/pages/onboarding'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={null}>
    {createElement(Component, props)}
  </Suspense>
);

const onboardingRoutes: RouteObject[] = [
  { path: `${RouteConfig.Onboarding.template}/*`, element: withSuspense(Onboarding) },
];

export default onboardingRoutes;
