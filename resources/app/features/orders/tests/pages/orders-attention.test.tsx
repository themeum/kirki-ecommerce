import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Orders from '@/features/orders/pages/orders';

const { useOrdersQuery } = vi.hoisted(() => ({ useOrdersQuery: vi.fn() }));

vi.mock('@/features/orders/services/order', () => ({ useOrdersQuery }));

vi.mock('@/features/orders/components/order-table/order-table', () => ({
  default: () => null,
}));

vi.setConfig({ testTimeout: 20000 });

const LocationProbe = () => {
  const location = useLocation();

  return <div data-testid="location">{location.search}</div>;
};

const renderAt = (url: string) => {
  render(
    <div id="wpbody-content">
      <div className="kirki-ecommerce-root">
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[url]}>
            <Routes>
              <Route
                path="/orders"
                element={
                  <>
                    <Orders />
                    <LocationProbe />
                  </>
                }
              />
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

  it('sends the attention filter from the address and shows its chip', () => {
    renderAt('/orders?attention=to_ship');

    expect(useOrdersQuery).toHaveBeenCalledWith(expect.objectContaining({ attention: 'to_ship' }));
    expect(screen.getByTestId('order-attention-chip')).toHaveTextContent('To ship');
  });

  it('removes the filter from the list and the address with the chip', () => {
    renderAt('/orders?attention=to_collect');

    expect(screen.getByTestId('order-attention-chip')).toHaveTextContent('To collect');

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(screen.queryByTestId('order-attention-chip')).not.toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).not.toContain('attention');
  });

  it('shows no chip without the filter', () => {
    renderAt('/orders');

    expect(screen.queryByTestId('order-attention-chip')).not.toBeInTheDocument();
  });
});
