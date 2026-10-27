import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import { paymentKeys } from '@/features/settings';
import type { PaymentMethod } from '@/features/settings/payment/schemas/catalog/payment';
import { useReorderPaymentMethodsMutation } from '@/features/settings/payment/services/payment';
import { server } from '@/tests/msw/server';

const orderUrl = `${window.kirki_ecommerce.rest_url_base}${endpoints.PAYMENT_METHODS_ORDER}`;

const methods: PaymentMethod[] = [
  { id: 'cod', name: 'Cash on Delivery', is_enabled: true, is_offline: true, icon_media: null },
  { id: 'bank', name: 'Bank Transfer', is_enabled: true, is_offline: true, icon_media: null },
  { id: 'paypal', name: 'PayPal', is_enabled: false, is_offline: false, icon_media: null },
];

const renderReorderMutation = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(paymentKeys.methods.all, methods);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useReorderPaymentMethodsMutation(), { wrapper });

  return { queryClient, result };
};

const cachedIds = (queryClient: QueryClient) =>
  queryClient.getQueryData<PaymentMethod[]>(paymentKeys.methods.all)?.map((method) => method.id);

describe('useReorderPaymentMethodsMutation', () => {
  it('reorders the cached list before the server responds', async () => {
    let respond: () => void = () => undefined;
    const responded = new Promise<void>((resolve) => {
      respond = resolve;
    });

    server.use(
      http.put(orderUrl, async () => {
        await responded;

        return HttpResponse.json({
          success: true,
          message: '',
          data: [methods[1], methods[2], methods[0]],
        });
      }),
    );

    const { queryClient, result } = renderReorderMutation();

    act(() => {
      result.current.mutate(['bank', 'paypal', 'cod']);
    });

    await waitFor(() => expect(cachedIds(queryClient)).toEqual(['bank', 'paypal', 'cod']));

    respond();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cachedIds(queryClient)).toEqual(['bank', 'paypal', 'cod']);
  });

  it('restores the previous order when the server rejects it', async () => {
    server.use(
      http.put(orderUrl, () =>
        HttpResponse.json(
          { success: false, message: 'Validation failed!', errors: { ids: ['Invalid'] } },
          { status: 422 },
        ),
      ),
    );

    const { queryClient, result } = renderReorderMutation();

    act(() => {
      result.current.mutate(['paypal', 'cod', 'bank']);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cachedIds(queryClient)).toEqual(['cod', 'bank', 'paypal']);
  });
});
