import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const Customers = lazy(() => import('@/features/customers/pages/customers'));
const CustomerDetails = lazy(() => import('@/features/customers/pages/customer-details/customer-details'));
const CustomerGroups = lazy(() => import('@/features/customers/pages/customer-groups/customer-groups'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={null}>
    {createElement(Component, props)}
  </Suspense>
);

const CustomerRoutes = RouteConfig.Customers;

const customersRoutes: RouteObject[] = [
  { path: CustomerRoutes.template, element: withSuspense(Customers) },
  { path: CustomerRoutes.get('CustomerDetail').template, element: withSuspense(CustomerDetails) },
  { path: CustomerRoutes.get('CustomerGroups').template, element: withSuspense(CustomerGroups) },
];

export default customersRoutes;
