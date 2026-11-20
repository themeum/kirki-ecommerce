import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useCouponActionMutation,
  useDeleteCouponMutation,
} from '@/features/coupons/services/coupon';
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

describe('coupon toasts', () => {
  beforeEach(() => {
    api.patch.mockResolvedValue({ message: 'Coupon activated', data: {} });
    api.delete.mockResolvedValue({ message: 'Coupon deleted' });
    vi.mocked(toastMutationSuccess).mockClear();
  });

  it.each([
    ['activate', '"SAVE10" activated'],
    ['deactivate', '"SAVE10" deactivated'],
    ['duplicate', '"SAVE10" duplicated'],
  ] as const)('names the coupon for %s', async (action, expected) => {
    const { result } = renderHook(() => useCouponActionMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 3, action, name: 'SAVE10' });
    });

    expect(api.patch).toHaveBeenCalledWith(expect.any(String), { action });
    expect(toastMutationSuccess).toHaveBeenCalledWith(expected);
  });

  it('uses the server message when the name is not known', async () => {
    const { result } = renderHook(() => useCouponActionMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 3, action: 'activate' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('Coupon activated');
  });

  it('names a deleted coupon', async () => {
    const { result } = renderHook(() => useDeleteCouponMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 3, name: 'SAVE10' });
    });

    expect(toastMutationSuccess).toHaveBeenCalledWith('"SAVE10" deleted');
  });
});
