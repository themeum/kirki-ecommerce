import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useDeleteShippingBoxMutation,
  useUpdateShippingBoxMutation,
} from '@/features/settings/shipping/services/shipping';
import { toastMutationSuccess } from '@/services/helpers';

const api = vi.hoisted(() => ({ put: vi.fn(), delete: vi.fn() }));

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

describe('shipping box toasts', () => {
  beforeEach(() => {
    api.put.mockResolvedValue({ message: 'Shipping box updated', data: {} });
    api.delete.mockResolvedValue({ message: 'Shipping box deleted' });
    vi.mocked(toastMutationSuccess).mockClear();
  });

  it('shows the caller text once for set as default', async () => {
    const { result } = renderHook(() => useUpdateShippingBoxMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 1,
        data: { is_default: true },
        successMessage: '"Small box" set as default',
      });
    });

    expect(toastMutationSuccess).toHaveBeenCalledTimes(1);
    expect(toastMutationSuccess).toHaveBeenCalledWith('"Small box" set as default');
    expect(api.put).toHaveBeenCalledWith(expect.any(String), { is_default: true });
  });

  it('shows the server message for a normal update', async () => {
    const { result } = renderHook(() => useUpdateShippingBoxMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 1, data: { name: 'Small box' } });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('Shipping box updated');
  });

  it('names a deleted box', async () => {
    const { result } = renderHook(() => useDeleteShippingBoxMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 1, name: 'Small box' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"Small box" deleted');
  });
});
