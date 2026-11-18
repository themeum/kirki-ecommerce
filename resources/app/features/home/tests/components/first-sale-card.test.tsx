import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import FirstSaleCard from '@/features/home/components/first-sale-card';
import type { FirstSale } from '@/features/home/schemas/catalog/first-sale';

const { state, dismiss, fulfill, celebration } = vi.hoisted(() => ({
  state: { current: undefined as FirstSale | undefined },
  dismiss: vi.fn(),
  fulfill: vi.fn(),
  celebration: vi.fn(),
}));

vi.mock('@/features/home/services/first-sale', () => ({
  useFirstSaleQuery: () => ({ data: state.current }),
  useFirstSaleDismissMutation: () => ({ mutate: dismiss }),
  useFirstSaleFulfillMutation: () => ({ mutate: fulfill }),
}));

vi.mock('@/features/home/hooks/use-first-sale-celebration', () => ({
  useFirstSaleCelebration: celebration,
}));

const firstSale = (overrides: Partial<FirstSale> = {}): FirstSale => ({
  is_visible: true,
  should_celebrate: true,
  order: {
    id: 12,
    order_number: '#2026-2236',
    customer_name: 'Ibrahim Fischer',
    invoiced_total_money_object: {
      raw: 43.88,
      display: '£43.88',
      currency: { code: 'GBP', symbol: '£' },
    },
  },
  ...overrides,
});

const CurrentPath = () => <div data-testid="path">{useLocation().pathname}</div>;

const renderCard = () => {
  render(
    <MemoryRouter>
      <FirstSaleCard />
      <CurrentPath />
    </MemoryRouter>,
  );
};

describe('FirstSaleCard', () => {
  beforeEach(() => {
    state.current = firstSale();
    dismiss.mockReset();
    fulfill.mockReset();
    celebration.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('names the customer, the total and the order', () => {
    renderCard();

    const card = screen.getByRole('status', { name: 'Your first sale' });

    expect(card).toHaveTextContent('You made your first sale!');
    expect(card).toHaveTextContent(
      'Ibrahim Fischer ordered £43.88 (#2026-2236). Every store starts with one order. This one is yours.',
    );
    expect(screen.getByRole('link', { name: '#2026-2236' })).toHaveAttribute('href', '/orders/12');
  });

  it('falls back to a generic name when the order has no customer name', () => {
    state.current = firstSale({ order: { ...firstSale().order!, customer_name: null } });
    renderCard();

    expect(screen.getByRole('status')).toHaveTextContent('A customer ordered £43.88');
  });

  it('closes the card for the current admin', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(fulfill).not.toHaveBeenCalled();
  });

  it('records the fulfill click and opens the order', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Fulfill order' }));

    expect(fulfill).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('path')).toHaveTextContent('/orders/12');
  });

  it('renders nothing when the card is not visible', () => {
    state.current = firstSale({ is_visible: false, should_celebrate: false });
    renderCard();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('passes the celebration flag to the celebration hook', () => {
    state.current = firstSale({ should_celebrate: false });
    renderCard();

    expect(celebration).toHaveBeenCalledWith(false, expect.anything());
  });
});
