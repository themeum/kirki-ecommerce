import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useBulkRestoreProductsMutation,
  useBulkTrashProductsMutation,
  useDeleteProductMutation,
  useDuplicateProductMutation,
} from '@/features/products/services/product';
import { toastMutationSuccess } from '@/services/helpers';

const api = vi.hoisted(() => ({ post: vi.fn(), delete: vi.fn() }));

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

describe('product toasts', () => {
  beforeEach(() => {
    api.post.mockResolvedValue({ message: 'Products moved to trash', data: {} });
    api.delete.mockResolvedValue({ message: 'Product deleted permanently' });
    vi.mocked(toastMutationSuccess).mockClear();
  });

  it('names one product moved to trash and keeps the description', async () => {
    const { result } = renderHook(() => useBulkTrashProductsMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ids: [5], name: 'T-shirt' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"T-shirt" moved to trash', {
      description: 'Restore them any time from the Trashed filter.',
    });
    expect(api.post).toHaveBeenCalledWith(expect.any(String), { action: 'trash', ids: [5] });
  });

  it('does not name products in a bulk trash', async () => {
    const { result } = renderHook(() => useBulkTrashProductsMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ids: [5, 6], name: 'T-shirt' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('Products moved to trash', expect.anything());
  });

  it('names one restored product', async () => {
    const { result } = renderHook(() => useBulkRestoreProductsMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ action: 'restore', ids: [5], name: 'T-shirt' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"T-shirt" restored');
  });

  it('names a duplicated product', async () => {
    const { result } = renderHook(() => useDuplicateProductMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 5, name: 'T-shirt' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"T-shirt" duplicated');
  });

  it('names a product deleted permanently', async () => {
    const { result } = renderHook(() => useDeleteProductMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 5, name: 'T-shirt' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"T-shirt" deleted permanently');
  });
});
