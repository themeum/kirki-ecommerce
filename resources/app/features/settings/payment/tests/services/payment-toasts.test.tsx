import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useDeleteOfflinePaymentMutation,
  useSetEnabledOfflinePaymentMutation,
  useSetEnabledOnlinePaymentMutation,
  useUninstallOnlinePaymentMutation,
} from '@/features/settings/payment/services/payment';
import { toastMutationSuccess } from '@/services/helpers';

const api = vi.hoisted(() => ({ patch: vi.fn(), delete: vi.fn() }));

vi.mock('@/libs/api', () => ({ apiClient: api }));

vi.mock('@/wpi18n', () => ({
  __: (text: string) => text,
  sprintf: (format: string, value: string) => format.replace('%s', value),
}));

vi.mock('@/services/helpers', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  parseResponse: (_schema: unknown, response: unknown) => response,
  parseMessage: (response: unknown) => response,
  toastMutationSuccess: vi.fn(),
  toastMutationError: vi.fn(),
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('payment method toasts', () => {
  beforeEach(() => {
    api.patch.mockResolvedValue({ message: '', data: true });
    api.delete.mockResolvedValue({ message: '' });
    vi.mocked(toastMutationSuccess).mockClear();
  });

  it('names an offline method that is deactivated', async () => {
    const { result } = renderHook(() => useSetEnabledOfflinePaymentMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'cod',
        data: { is_enabled: false },
        name: 'Cash on delivery',
      });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"Cash on delivery" deactivated');
  });

  it('names an online gateway that is activated', async () => {
    const { result } = renderHook(() => useSetEnabledOnlinePaymentMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'stripe',
        data: { is_enabled: true },
        name: 'Stripe',
      });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"Stripe" activated');
  });

  it('uses the item type when the name is not known', async () => {
    const { result } = renderHook(() => useSetEnabledOfflinePaymentMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'cod', data: { is_enabled: true } });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('Payment method activated');
  });

  it('names a deleted offline method', async () => {
    const { result } = renderHook(() => useDeleteOfflinePaymentMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'cheque', name: 'Cheque payments' });
    });

    expect(api.delete).toHaveBeenCalledWith(expect.stringContaining('cheque'));
    expect(toastMutationSuccess).toHaveBeenCalledWith('"Cheque payments" deleted');
  });

  it('names a removed online gateway', async () => {
    const { result } = renderHook(() => useUninstallOnlinePaymentMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'stripe', name: 'Stripe' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"Stripe" removed');
  });
});
