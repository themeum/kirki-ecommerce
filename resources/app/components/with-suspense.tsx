import { type ComponentType, createElement, type ReactElement, Suspense } from 'react';

import PageSkeleton from '@/components/skeletons/page-skeleton';

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<PageSkeleton />}>
    {createElement(Component, props)}
  </Suspense>
);

export default withSuspense;
