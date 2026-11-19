import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Orders from '@/features/orders/pages/orders';

const { useOrdersQuery } = vi.hoisted(() => ({ useOrdersQuery: vi.fn() }));

vi.mock('@/features/orders/services/order', () => ({ useOrdersQuery }));

vi.mock('@/features/orders/components/order-table/order-table', () => ({
  default: () => null,
}));

vi.setConfig({ testTimeout: 20000 });

const renderAt = (url: string) => {
  render(
    <div id="wpbody-content">
      <div className="kirki-ecommerce-root">
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[url]}>
            <Routes>
              <Route path="/orders" element={<Orders />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </div>
    </div>,
  );
};

describe('Orders attention filter', () => {
  beforeEach(() => {
    useOrdersQuery.mockReturnValue({
      data: { results: [], has_records: true },
      isFetching: false,
      isError: false,
      isFetched: true,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('sends the attention filter from the address', () => {
    renderAt('/orders?attention=to_ship');

    expect(useOrdersQuery).toHaveBeenCalledWith(expect.objectContaining({ attention: 'to_ship' }));
  });

  it('sends no attention filter without it in the address', () => {
    renderAt('/orders');

    expect(useOrdersQuery).toHaveBeenCalledWith(
      expect.not.objectContaining({ attention: 'to_ship' }),
    );
    expect(useOrdersQuery).toHaveBeenCalledWith(
      expect.not.objectContaining({ attention: 'to_collect' }),
    );
  });
});
