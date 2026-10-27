import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OnboardingWizard from '@/features/onboarding/components/onboarding-wizard';
import { DRAFT_STORAGE_KEY } from '@/features/onboarding/lib/onboarding-draft';

const { createStore, sampleData } = vi.hoisted(() => ({
  createStore: {
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    mutate: vi.fn(),
  },
  sampleData: {
    phase: 'idle' as const,
    start: vi.fn(),
    onLoaded: (): void => undefined,
  },
}));

vi.mock('@/features/onboarding/services/onboarding', () => ({
  useCreateStoreMutation: () => createStore,
}));

vi.mock('@/features/home', () => ({
  useSampleDataImport: ({ onLoaded }: { onLoaded: () => void }) => {
    sampleData.onLoaded = onLoaded;

    return { phase: sampleData.phase, start: sampleData.start };
  },
}));

vi.mock('@/features/settings', () => ({
  useAllCurrenciesQuery: () => ({ data: [] }),
}));

vi.mock('@/services/country', () => ({
  useCountriesQuery: () => ({ data: [] }),
}));

const essentialsValues = { store_name: 'Acme', country: 'BD', currency: 'USD' };

const startFromDraft = (step: number, values: Record<string, unknown>) => {
  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ step, values }));
};

const waitForSetupReady = () =>
  waitFor(
    () => expect(screen.getByRole('button', { name: 'Add your first product' })).toBeEnabled(),
    { timeout: 3000 },
  );

const getProgress = () => Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));

const renderWizard = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/products" element={<p>Products list</p>} />
        <Route path="/products/create" element={<p>Create product</p>} />
        <Route path="/" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('onboarding wizard', () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    createStore.isSuccess = false;
    createStore.mutate.mockReset();
  });

  it('clears a step error as soon as the field is corrected', async () => {
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Store name is required')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g., Acme Store'), {
      target: { value: 'Acme' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Store name is required')).not.toBeInTheDocument();
    });
  });

  it('goes back from step two with the Back button beside the title', async () => {
    renderWizard();

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Store name'), { target: { value: 'Acme' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Where do you sell from?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByText("Let's set up your store")).toBeInTheDocument();
  });

  it('shows the step number without a total', () => {
    renderWizard();

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText(/of 3/)).not.toBeInTheDocument();
    expect(getProgress()).toBe(0);
  });

  it('fills the bar with the steps already done', () => {
    startFromDraft(2, essentialsValues);
    renderWizard();

    expect(getProgress()).toBeCloseTo(66.67, 1);
  });

  it('switches the Essentials action to Continue when tax is collected', async () => {
    startFromDraft(2, essentialsValues);
    renderWizard();

    expect(screen.getByRole('button', { name: 'Create Store' })).toBeInTheDocument();
    expect(
      screen.getByText('Shop, Cart, Checkout and Account pages will be created'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));

    expect(await screen.findByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create Store' })).not.toBeInTheDocument();
    expect(
      screen.queryByText('Shop, Cart, Checkout and Account pages will be created'),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Permit or VAT number')).not.toBeInTheDocument();
  });

  it('opens the Store Tax step after Essentials when tax is collected', async () => {
    startFromDraft(2, { ...essentialsValues, is_tax_collected: true });
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Tax Info')).toBeInTheDocument();
    expect(screen.getByText('Step 4')).toBeInTheDocument();
    expect(screen.getByText('Store Tax')).toBeInTheDocument();
    expect(getProgress()).toBe(75);
    expect(screen.getByRole('radio', { name: 'Excluding Tax' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Create Store' })).toBeInTheDocument();
    expect(createStore.mutate).not.toHaveBeenCalled();
  });

  it('reopens Essentials when a Store Tax draft no longer collects tax', () => {
    startFromDraft(3, { ...essentialsValues, is_tax_collected: false });
    renderWizard();

    expect(screen.getByText('Setup the essentials')).toBeInTheDocument();
  });

  it('hides the step number and disables the sample data link while setup runs', async () => {
    startFromDraft(2, essentialsValues);
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: 'Create Store' }));

    expect(await screen.findByText('Your store is almost ready')).toBeInTheDocument();
    expect(screen.getByText('Setup Complete')).toBeInTheDocument();
    expect(getProgress()).toBe(100);
    expect(screen.queryByText(/^Step \d/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Click here to load sample data!' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add your first product' })).toBeDisabled();
    expect(createStore.mutate).toHaveBeenCalledTimes(1);
  });

  it('enables the actions once every row completes', async () => {
    createStore.isSuccess = true;
    startFromDraft(2, essentialsValues);
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: 'Create Store' }));

    await waitForSetupReady();
    expect(screen.getByText('Your store is almost ready')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Click here to load sample data!' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Click here to load sample data!' }));
    expect(sampleData.start).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Add your first product' }));
    expect(await screen.findByText('Create product')).toBeInTheDocument();
  });

  it('goes to the dashboard from the completion screen', async () => {
    createStore.isSuccess = true;
    startFromDraft(2, essentialsValues);
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: 'Create Store' }));
    await waitForSetupReady();

    fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }));
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('opens the products list when the sample data is loaded', async () => {
    startFromDraft(2, essentialsValues);
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: 'Create Store' }));
    await screen.findByText('Your store is almost ready');

    sampleData.onLoaded();

    expect(await screen.findByText('Products list')).toBeInTheDocument();
  });

  it('lists the configurations without tax when tax is not collected', async () => {
    startFromDraft(2, essentialsValues);
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: 'Create Store' }));

    expect(await screen.findByText('Configurations')).toBeInTheDocument();
    expect(screen.getByText('Essentials, Shipping, Legal pages')).toBeInTheDocument();
  });

  it('lists tax in the configurations when tax is collected', async () => {
    startFromDraft(3, { ...essentialsValues, is_tax_collected: true, is_tax_inclusive_price: true });
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: 'Create Store' }));

    expect(await screen.findByText('Essentials, Shipping, Tax, Legal pages')).toBeInTheDocument();
  });
});
