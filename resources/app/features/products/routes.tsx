import { type ComponentType, createElement, lazy, type ReactElement, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { RouteConfig } from '@/config/route-config';

const Products = lazy(() => import('@/features/products/pages/products'));
const CreateProduct = lazy(() => import('@/features/products/pages/create-product'));
const EditProduct = lazy(() => import('@/features/products/pages/edit-product'));

const withSuspense = <Props extends object>(
  Component: ComponentType<Props>,
  props = {} as Props,
): ReactElement => (
  <Suspense fallback={null}>
    {createElement(Component, props)}
  </Suspense>
);

const ProductRoutes = RouteConfig.Products;

const productsRoutes: RouteObject[] = [
  { path: ProductRoutes.template, element: withSuspense(Products) },
  { path: ProductRoutes.get('CreateProduct').template, element: withSuspense(CreateProduct) },
  { path: ProductRoutes.get('EditProduct').template, element: withSuspense(EditProduct) },
];

export default productsRoutes;
