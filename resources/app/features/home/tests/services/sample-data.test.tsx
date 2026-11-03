import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useImportSampleDataMutation } from '@/features/home/services/sample-data';

vi.mock('@/libs/api', () => ({
  apiClient: { post: vi.fn(() => Promise.resolve({ data: null })) },
}));

vi.mock('@/services/helpers', () => ({
  parseResponse: (_schema: unknown, response: { data: unknown }) => response.data,
  toastMutationError: vi.fn(),
}));

describe('useImportSampleDataMutation', () => {
  it('resolves without waiting for the invalidated queries to load again', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const slowQuery = vi.fn(() =>
      slowQuery.mock.calls.length === 1 ? 'loaded' : new Promise(() => undefined),
    );
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => ({
        query: useQuery({ queryKey: ['slow'], queryFn: slowQuery }),
        mutation: useImportSampleDataMutation(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.query.data).toBe('loaded'));

    let isResolved = false;
    await act(async () => {
      await result.current.mutation.mutateAsync();
      isResolved = true;
    });

    expect(isResolved).toBe(true);
    expect(slowQuery).toHaveBeenCalledTimes(2);
  });
});
