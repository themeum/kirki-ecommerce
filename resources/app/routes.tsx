import { createHashRouter } from 'react-router';

import analyticsRoutes from '@/features/analytics/routes';
import brandsRoutes from '@/features/brands/routes';
import bulkEditRoutes from '@/features/bulk-edit/routes';
import categoriesRoutes from '@/features/categories/routes';
import collectionsRoutes from '@/features/collections/routes';
import couponsRoutes from '@/features/coupons/routes';
import customersRoutes from '@/features/customers/routes';
import homeRoutes from '@/features/home/routes';
import inventoryRoutes from '@/features/inventory/routes';
import { OnboardingGate } from '@/features/onboarding';
import onboardingRoutes from '@/features/onboarding/routes';
import ordersRoutes from '@/features/orders/routes';
import productsRoutes from '@/features/products/routes';
import settingsRoutes from '@/features/settings/routes';
import systemRoutes from '@/features/system/routes';
import tagsRoutes from '@/features/tags/routes';
import UnsavedChangesController from '@/floating-components/unsaved-tracker';

export const router = createHashRouter([
  ...onboardingRoutes,
  {
    element: <UnsavedChangesController />,
    children: [
      {
        element: <OnboardingGate />,
        children: [
          ...homeRoutes,
          ...productsRoutes,
          ...bulkEditRoutes,
          ...inventoryRoutes,
          ...couponsRoutes,
          ...ordersRoutes,
          ...analyticsRoutes,
          ...collectionsRoutes,
          ...tagsRoutes,
          ...categoriesRoutes,
          ...brandsRoutes,
          ...customersRoutes,
          ...settingsRoutes,
          ...systemRoutes,
        ],
      },
    ],
  },
]);
