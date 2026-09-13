import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import VariationList from '@/features/settings/essentials/pages/variation-library/variation-library';
import { server } from '@/tests/msw/server';

const attributes = [
  { id: 7, name: 'Rong', type: 'color', values: [{ id: 1, value: 'Green', color: '#00ff00' }] },
  { id: 9, name: 'Material', type: 'list', values: [] },
];

const renderList = () => {
  server.use(
    http.get('https://example.test/wp-json/kirki/ecommerce/v1/attributes', () =>
      HttpResponse.json({ data: { results: attributes, total: 2, per_page: 10 } }),
    ),
  );

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter([{ path: '/', element: <VariationList /> }]);

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

afterEach(cleanup);

describe('VariationList', () => {
  it('links a color variation name to its edit page', async () => {
    renderList();

    expect(await screen.findByRole('link', { name: 'Rong' })).toHaveAttribute(
      'href',
      '/settings/essentials/color/7',
    );
  });

  it('links a list variation name to its edit page', async () => {
    renderList();

    expect(await screen.findByRole('link', { name: 'Material' })).toHaveAttribute(
      'href',
      '/settings/essentials/list/9',
    );
  });
});
