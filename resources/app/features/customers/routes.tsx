import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import { RouteConfig } from '@/config/route-config';

const Customers = lazy(() => import('@/features/customers/pages/customers'));
const CustomerDetails = lazy(() => import('@/features/customers/pages/customer-details/customer-details'));
const CustomerGroups = lazy(() => import('@/features/customers/pages/customer-groups/customer-groups'));

const CustomerRoutes = RouteConfig.Customers;

const customersRoutes: RouteObject[] = [
  { path: CustomerRoutes.template, element: withSuspense(Customers) },
  { path: CustomerRoutes.get('CustomerDetail').template, element: withSuspense(CustomerDetails) },
  { path: CustomerRoutes.get('CustomerGroups').template, element: withSuspense(CustomerGroups) },
];

export default customersRoutes;
