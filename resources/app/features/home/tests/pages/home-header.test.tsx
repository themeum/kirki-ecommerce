import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HOME_LAYOUT_STORAGE_KEY } from '@/features/home/hooks/use-home-layout';
import { DEFAULT_HOME_LAYOUT } from '@/features/home/lib/layout';
import Home from '@/features/home/pages/home';

vi.mock('@/features/home/services/setup-checklist', () => ({
  useSetupChecklistQuery: () => ({ data: undefined }),
}));

vi.mock('@/features/home/components/home-sections', () => ({
  default: () => null,
}));

vi.mock('@/features/home/components/setup-checklist', () => ({
  default: () => null,
}));

vi.mock('@/features/home/components/template-gallery', () => ({
  default: () => null,
}));

vi.mock('@/features/home/components/first-sale-card', () => ({
  default: () => <div data-testid="first-sale-card" />,
}));

vi.mock('@/hooks/use-current-user', () => ({
  default: () => ({ first_name: 'Sara', display_name: 'sara' }),
}));

vi.setConfig({ testTimeout: 20000 });

const renderHome = (isSetupComplete: boolean) => {
  window.kirki_ecommerce.is_setup_complete = isSetupComplete;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <div id="wpbody-content">
      <div className="kirki-ecommerce-root">
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <Home />
          </MemoryRouter>
        </QueryClientProvider>
      </div>
    </div>,
  );
};

const actionNames = () =>
  screen
    .getAllByRole('link')
    .map((link) => link.textContent)
    .filter((name) => name !== '');

describe('Home header', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.kirki_ecommerce.is_setup_complete = false;
  });

  it('shows the period subtitle, the default quick actions and the Customize button', () => {
    renderHome(true);

    expect(screen.getByText('Welcome, Sara')).toBeInTheDocument();
    expect(screen.getByText('Your store at a glance:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Period: This month. Change' })).toBeInTheDocument();
    expect(actionNames()).toEqual(['View live site', 'Create order']);
    expect(screen.getByRole('link', { name: 'Create order' })).toHaveAttribute(
      'href',
      '/orders/create',
    );
    expect(screen.getByRole('button', { name: 'Customize home' })).toBeInTheDocument();
  });

  it('opens View live site in a new tab', () => {
    renderHome(true);

    const link = screen.getByRole('link', { name: 'View live site' });

    expect(link).toHaveAttribute('href', window.kirki_ecommerce.site_url);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('makes the first action that is on the main button, at the right', () => {
    window.localStorage.setItem(
      HOME_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_HOME_LAYOUT,
        actions: [
          { key: 'add_product', visible: true },
          { key: 'create_order', visible: true },
          { key: 'view_live_site', visible: false },
          { key: 'create_coupon', visible: true },
          { key: 'add_customer', visible: false },
        ],
      }),
    );
    renderHome(true);

    expect(actionNames()).toEqual(['Create coupon', 'Create order', 'Add product']);
    expect(screen.getByRole('link', { name: 'Create coupon' })).toHaveAttribute(
      'href',
      '/coupons/create',
    );
  });

  it('changes the period from the menu and remembers it', () => {
    renderHome(true);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Period: This month. Change' }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: 'Today' }));

    expect(screen.getByRole('button', { name: 'Period: Today. Change' })).toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem(HOME_LAYOUT_STORAGE_KEY) ?? '{}') as {
      period?: string;
    };

    expect(saved.period).toBe('today');
  });

  it('keeps the checklist header when setup is not complete', () => {
    renderHome(false);

    expect(screen.getByText('Let’s get you started')).toBeInTheDocument();
    expect(screen.queryByText('Your store at a glance:')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Customize home' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Live Site' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add Product' })).toBeInTheDocument();
  });

  it.each([
    ['checklist', false],
    ['overview', true],
  ])('shows the first-sale card in %s mode', (_mode, isSetupComplete) => {
    renderHome(isSetupComplete);

    expect(screen.getByTestId('first-sale-card')).toBeInTheDocument();
  });
});
