import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import GeneralSettings from '@/features/settings/general/pages/general-settings';
import SettingsLayout from '@/features/settings/pages/settings-layout';
import { server } from '@/tests/msw/server';

const url = (path: string) => `${window.kirki_ecommerce.rest_url_base}${path}`;

const storedSettings = {
  store_name: 'Kirki Ecommerce',
  store_email: 'info@kirki.com',
  store_logo: null,
  store_phone: null,
  store_address: null,
  selling_location_type: 'all-countries',
  selling_countries: [],
  order_number: null,
  invoice_number: null,
  is_tax_calculation_enabled: true,
};

const useHandlers = () => {
  server.use(
    http.get(url(endpoints.SETTINGS_BY_KEY('general')), () =>
      HttpResponse.json({ success: true, message: '', data: storedSettings }),
    ),
    http.get(url(endpoints.COUNTRIES), () =>
      HttpResponse.json({ success: true, message: '', data: [] }),
    ),
  );
};

const renderGeneralSettings = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Outlet context={{ confirmAction: () => undefined }} />,
        children: [
          {
            path: 'settings',
            element: <SettingsLayout />,
            children: [{ path: 'general', element: <GeneralSettings /> }],
          },
        ],
      },
    ],
    { initialEntries: ['/settings/general'] },
  );

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

const getFloatingBar = () => document.querySelector<HTMLElement>('[data-slot="floating-bar"]')!;

beforeEach(useHandlers);
afterEach(cleanup);

describe('GeneralSettings unsaved changes bar', () => {
  it('hides the bar after discarding when the stored order and invoice numbers are null', async () => {
    renderGeneralSettings();

    const storeName = await screen.findByDisplayValue('Kirki Ecommerce');
    fireEvent.change(storeName, { target: { value: 'Kirki Ecommerce Changed' } });

    await waitFor(() => {
      expect(getFloatingBar()).toHaveAttribute('aria-hidden', 'false');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Discard', hidden: true }));

    await waitFor(() => {
      expect(getFloatingBar()).toHaveAttribute('aria-hidden', 'true');
    });
    expect(storeName).toHaveValue('Kirki Ecommerce');
  });
});
