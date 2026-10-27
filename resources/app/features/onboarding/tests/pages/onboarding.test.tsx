import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DRAFT_STORAGE_KEY } from '@/features/onboarding/lib/onboarding-draft';
import { beginSetupSession, markOnboarded } from '@/features/onboarding/lib/onboarding-status';
import Onboarding from '@/features/onboarding/pages/onboarding';

const { sampleData } = vi.hoisted(() => ({
  sampleData: { onLoaded: (): void => undefined },
}));

vi.mock('@/features/onboarding/services/onboarding', () => ({
  useCreateStoreMutation: () => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
    data: undefined,
    mutate: vi.fn(),
  }),
}));

vi.mock('@/features/home', () => ({
  useSampleDataImport: ({ onLoaded }: { onLoaded: () => void }) => {
    sampleData.onLoaded = onLoaded;

    return { phase: 'idle', start: vi.fn() };
  },
}));

vi.mock('@/features/settings', () => ({
  useAllCurrenciesQuery: () => ({ data: [] }),
}));

vi.mock('@/services/country', () => ({
  useCountriesQuery: () => ({ data: [] }),
}));

const renderCompletionScreen = async () => {
  sessionStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({ step: 2, values: { store_name: 'Acme', country: 'BD', currency: 'USD' } }),
  );

  markOnboarded();
  beginSetupSession();

  const router = createMemoryRouter(
    [
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/products', element: <p>Products list</p> },
      { path: '/products/create', element: <p>Create product</p> },
      { path: '/', element: <p>Dashboard</p> },
    ],
    { initialEntries: ['/onboarding'] },
  );

  render(<RouterProvider router={router} />);

  fireEvent.click(await screen.findByRole('button', { name: 'Create Store' }));

  await waitFor(
    () => expect(screen.getByRole('button', { name: 'Add your first product' })).toBeEnabled(),
    { timeout: 3000 },
  );
};

describe('onboarding page', () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it('opens the create-product page from "Add your first product"', async () => {
    await renderCompletionScreen();

    fireEvent.click(screen.getByRole('button', { name: 'Add your first product' }));

    expect(await screen.findByText('Create product')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('opens the products list when the sample data is loaded', async () => {
    await renderCompletionScreen();

    act(() => sampleData.onLoaded());

    expect(await screen.findByText('Products list')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
