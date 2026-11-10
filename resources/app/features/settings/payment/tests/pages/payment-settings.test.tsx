import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import { paymentKeys } from '@/features/settings';
import PaymentSettings from '@/features/settings/payment/pages/payment-settings';
import { server } from '@/tests/msw/server';

const baseUrl = window.kirki_ecommerce.rest_url_base;

const cachedMethods = [{ id: 'cod', name: 'Cash on delivery', is_enabled: true, is_offline: true }];

describe('PaymentSettings while the list refetches', () => {
  afterEach(cleanup);

  it('keeps the real list on screen and does not show the skeleton', async () => {
    server.use(
      http.get(`${baseUrl}${endpoints.PAYMENT_METHODS}`, async () => {
        await delay('infinite');

        return HttpResponse.json({ success: true, message: '', data: [] });
      }),
      http.get(`${baseUrl}${endpoints.ONLINE_PAYMENTS_INSTALLABLE}`, () =>
        HttpResponse.json({ success: true, message: '', data: [] }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(paymentKeys.methods.all, cachedMethods);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PaymentSettings />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    act(() => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.methods.all });
    });

    await waitFor(() => {
      expect(queryClient.isFetching({ queryKey: paymentKeys.methods.all })).toBe(1);
    });


    expect(screen.getByText('Cash on delivery')).toBeTruthy();
    expect(document.querySelector('[data-slot="skeleton"]')).toBeNull();
  });
});
