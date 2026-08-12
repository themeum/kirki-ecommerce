import { createHashRouter, Navigate } from 'react-router';

import { RouteConfig } from '@/config/route-config';
import brandsRoutes from '@/features/brands/routes';
import bulkEditRoutes from '@/features/bulk-edit/routes';
import categoriesRoutes from '@/features/categories/routes';
import collectionsRoutes from '@/features/collections/routes';
import couponsRoutes from '@/features/coupons/routes';
import customersRoutes from '@/features/customers/routes';
import inventoryRoutes from '@/features/inventory/routes';
import ordersRoutes from '@/features/orders/routes';
import productsRoutes from '@/features/products/routes';
import settingsRoutes from '@/features/settings/routes';
import systemRoutes from '@/features/system/routes';
import tagsRoutes from '@/features/tags/routes';
import UnsavedChangesController from '@/floating-components/unsaved-tracker';

const ProductRoutes = RouteConfig.Products;

export const router = createHashRouter([
  {
    element: <UnsavedChangesController />,
    children: [
      { path: RouteConfig.Home.template, element: <Navigate to={ProductRoutes.template} replace /> },
      ...productsRoutes,
      ...bulkEditRoutes,
      ...inventoryRoutes,
      ...couponsRoutes,
      ...ordersRoutes,
      ...collectionsRoutes,
      ...tagsRoutes,
      ...categoriesRoutes,
      ...brandsRoutes,
      ...customersRoutes,
      ...settingsRoutes,
      ...systemRoutes,
    ],
  },
]);
