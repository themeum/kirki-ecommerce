import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDeleteBrandMutation } from '@/features/brands/services/brand';
import { toastMutationSuccess } from '@/services/helpers';

const api = vi.hoisted(() => ({ delete: vi.fn() }));

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

describe('brand delete toast', () => {
  beforeEach(() => {
    api.delete.mockResolvedValue({ message: 'Brand deleted' });
    vi.mocked(toastMutationSuccess).mockClear();
  });

  it('names the deleted brand', async () => {
    const { result } = renderHook(() => useDeleteBrandMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 2, name: 'Acme' });
    });

    expect(api.delete).toHaveBeenCalledWith(expect.stringContaining('2'));
    expect(toastMutationSuccess).toHaveBeenCalledWith('"Acme" deleted');
  });

  it('uses the server message when the name is empty', async () => {
    const { result } = renderHook(() => useDeleteBrandMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 2, name: '' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('Brand deleted');
  });
});
