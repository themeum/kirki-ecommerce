import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { state, withQuery, table } = vi.hoisted(() => {
  const hoisted = { data: undefined as unknown };

  return {
    state: hoisted,
    withQuery: (hook: string) => async (importOriginal: () => Promise<object>) => ({
      ...(await importOriginal()),
      [hook]: () => ({ data: hoisted.data, isFetching: false, isFetched: true }),
    }),
    table: () => ({ default: () => 'TABLE_STUB' }),
  };
});

vi.mock('@/features/products/services/product', withQuery('useProductsQuery'));
vi.mock('@/features/orders/services/order', withQuery('useOrdersQuery'));
vi.mock('@/features/inventory/services/inventory', withQuery('useInventoryQuery'));
vi.mock('@/features/collections/services/collection', withQuery('useCollectionsQuery'));
vi.mock('@/features/categories/services/category', withQuery('useCategoriesQuery'));
vi.mock('@/features/tags/services/tag', withQuery('useTagsQuery'));
vi.mock('@/features/brands/services/brand', withQuery('useBrandsQuery'));
vi.mock('@/features/customers/services/customer', withQuery('useCustomersQuery'));
vi.mock('@/features/coupons/services/coupon', withQuery('useCouponsQuery'));

vi.mock('@/features/products/components/product-table/product-table', table);
vi.mock('@/features/orders/components/order-table/order-table', table);
vi.mock('@/features/inventory/components/inventory-table/inventory-table', table);
vi.mock('@/features/collections/components/collection-table/collection-table', table);
vi.mock('@/features/categories/components/category-table/category-table', table);
vi.mock('@/features/tags/components/tag-table/tag-table', table);
vi.mock('@/features/brands/components/brand-table/brand-table', table);
vi.mock('@/features/customers/components/customer-table/customer-table', table);
vi.mock('@/features/coupons/components/coupon-table/coupon-table', table);

const pages: Record<string, () => Promise<{ default: ComponentType }>> = {
  products: () => import('@/features/products/pages/products'),
  orders: () => import('@/features/orders/pages/orders'),
  inventory: () => import('@/features/inventory/pages/inventory'),
  collections: () => import('@/features/collections/pages/collections'),
  categories: () => import('@/features/categories/pages/categories'),
  tags: () => import('@/features/tags/pages/tags'),
  brands: () => import('@/features/brands/pages/brands'),
  customers: () => import('@/features/customers/pages/customers'),
  coupons: () => import('@/features/coupons/pages/coupons'),
};

const renderPage = async (name: string, data: unknown) => {
  state.data = data;
  const { default: Page } = await pages[name]();
  const router = createMemoryRouter([{ path: '/', element: <Page /> }]);

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

const results = { results: [], per_page: 10 };

afterEach(cleanup);

describe.each(Object.keys(pages))('%s list page empty state', (name) => {
  it('shows the first-use state when the table holds no record', async () => {
    await renderPage(name, { ...results, total: 0, has_records: false });

    expect(screen.queryByText('TABLE_STUB')).not.toBeInTheDocument();
  });

  it('keeps the table when a search matched nothing but records exist', async () => {
    await renderPage(name, { ...results, total: 0, has_records: true });

    expect(screen.getByText('TABLE_STUB')).toBeInTheDocument();
  });

  it('keeps the table while no response is available', async () => {
    await renderPage(name, undefined);

    expect(screen.getByText('TABLE_STUB')).toBeInTheDocument();
  });
});
