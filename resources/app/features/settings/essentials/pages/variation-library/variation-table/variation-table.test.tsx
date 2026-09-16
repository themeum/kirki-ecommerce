import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Attribute, AttributeValue } from '@/features/products';
import VariationTable from '@/features/settings/essentials/pages/variation-library/variation-table/variation-table';

const attribute = {
  id: 7,
  name: 'Rong',
  type: 'color',
  values: [],
  updated_at: '2026-09-11T00:00:00Z',
} as Attribute & { updated_at?: string };

const results: AttributeValue[] = [
  { id: 1, value: 'Green', color: '#00ff00' },
  { id: 2, value: 'Lime', color: '#00ff00' },
];

const renderTable = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={{ confirmAction: vi.fn() }} />,
      children: [
        {
          index: true,
          element: (
            <VariationTable results={results} selectedItem={attribute} updateDataList={vi.fn()} />
          ),
        },
      ],
    },
  ]);

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

afterEach(cleanup);

describe('VariationTable', () => {
  it('keeps the clicked edit button mounted so the popover stays anchored to it', () => {
    renderTable();

    const editButton = screen.getAllByRole('button', { name: 'Edit' })[0];

    fireEvent.click(editButton);

    expect(screen.getByLabelText('Title')).toHaveValue('Green');
    expect(editButton.isConnected).toBe(true);
  });
});
