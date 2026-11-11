import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '@/config/endpoints';
import OnlinePaymentPopup from '@/features/settings/payment/components/dialogs/online-payment-dialog';
import { server } from '@/tests/msw/server';

const baseUrl = window.kirki_ecommerce.rest_url_base;

const renderDialog = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <OnlinePaymentPopup openPopup setOpenPopup={vi.fn()} />
    </QueryClientProvider>,
  );
};

describe('OnlinePaymentPopup while the lists load', () => {
  afterEach(cleanup);

  it('shows a skeleton list and no spinner', () => {
    server.use(
      http.get(`${baseUrl}${endpoints.ONLINE_PAYMENTS_INSTALLABLE}`, async () => {
        await delay('infinite');

        return HttpResponse.json({ success: true, message: '', data: [] });
      }),
      http.get(`${baseUrl}${endpoints.OFFLINE_PAYMENTS}`, async () => {
        await delay('infinite');

        return HttpResponse.json({ success: true, message: '', data: [] });
      }),
    );

    renderDialog();

    expect(document.querySelector('[aria-busy="true"] [data-slot="skeleton"]')).toBeTruthy();
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
  });
});
