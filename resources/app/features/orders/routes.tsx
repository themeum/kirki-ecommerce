import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import LoadingSpinner from '@/components/loading-spinner';
import { RouteConfig } from '@/config/route-config';

const Orders = lazy(() => import('@/features/orders/pages/orders'));
const CreateOrder = lazy(() => import('@/features/orders/pages/order-create/order-create'));
const OrderDetails = lazy(() => import('@/features/orders/pages/order-details/order-details'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {createElement(Component, props)}
  </Suspense>
);

const OrderRoutes = RouteConfig.Orders;

const ordersRoutes: RouteObject[] = [
  { path: OrderRoutes.template, element: withSuspense(Orders) },
  { path: OrderRoutes.get('CreateOrder').template, element: withSuspense(CreateOrder) },
  { path: OrderRoutes.get('OrderDetail').template, element: withSuspense(OrderDetails) },
];

export default ordersRoutes;
