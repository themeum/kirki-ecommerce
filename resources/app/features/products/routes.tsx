import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import withSuspense from '@/components/with-suspense';
import { RouteConfig } from '@/config/route-config';

const Products = lazy(() => import('@/features/products/pages/products'));
const CreateProduct = lazy(() => import('@/features/products/pages/create-product/create-product'));
const EditProduct = lazy(() => import('@/features/products/pages/edit-product/edit-product'));

const ProductRoutes = RouteConfig.Products;

const productsRoutes: RouteObject[] = [
  { path: ProductRoutes.template, element: withSuspense(Products) },
  { path: ProductRoutes.get('CreateProduct').template, element: withSuspense(CreateProduct) },
  { path: ProductRoutes.get('EditProduct').template, element: withSuspense(EditProduct) },
];

export default productsRoutes;
