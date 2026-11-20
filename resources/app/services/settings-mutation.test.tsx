import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toastMutationSuccess } from '@/services/helpers';
import { useUpdateSettingsMutation } from '@/services/settings';

const api = vi.hoisted(() => ({ put: vi.fn() }));

vi.mock('@/libs/api', () => ({ apiClient: api }));

vi.mock('@/services/helpers', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  parseResponse: (_schema: unknown, response: unknown) => response,
  toastMutationSuccess: vi.fn(),
  toastMutationError: vi.fn(),
}));

const renderMutation = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useUpdateSettingsMutation<'shipping'>(), { wrapper });
};

describe('useUpdateSettingsMutation', () => {
  beforeEach(() => {
    api.put.mockResolvedValue({ message: 'Settings saved', data: {} });
    vi.mocked(toastMutationSuccess).mockClear();
  });

  it('shows the caller text in place of the server message', async () => {
    const { result } = renderMutation();

    await act(async () => {
      await result.current.mutateAsync({
        key: 'shipping',
        data: { shipping_zones: [] },
        successMessage: '"Europe" deactivated',
      });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"Europe" deactivated');
  });

  it('does not send the caller text to the server', async () => {
    const { result } = renderMutation();

    await act(async () => {
      await result.current.mutateAsync({
        key: 'shipping',
        data: { shipping_zones: [] },
        successMessage: 'Shipping zone created',
      });
    });

    expect(api.put).toHaveBeenCalledWith(expect.any(String), {
      key: 'shipping',
      data: { shipping_zones: [] },
    });
  });

  it('shows the server message when the caller gives no text', async () => {
    const { result } = renderMutation();

    await act(async () => {
      await result.current.mutateAsync({ key: 'shipping', data: { shipping_zones: [] } });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('Settings saved');
  });
});
