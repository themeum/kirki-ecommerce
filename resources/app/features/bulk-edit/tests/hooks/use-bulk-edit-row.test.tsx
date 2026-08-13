import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '@/config/endpoints';
import { BulkEditFormProvider } from '@/features/bulk-edit/contexts/bulk-edit-form-context';
import { useBulkEditRow } from '@/features/bulk-edit/hooks/use-bulk-edit-row';
import { server } from '@/tests/msw/server';

const renderUseBulkEditRow = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BulkEditFormProvider>{children}</BulkEditFormProvider>
    </QueryClientProvider>
  );

  return renderHook(
    () =>
      useBulkEditRow({
        index: 0,
        selectionData: null,
        setSelectionData: vi.fn(),
        isDragging: false,
        setIsDragging: vi.fn(),
      }),
    { wrapper },
  );
};

describe('useBulkEditRow mouseup listener', () => {
  beforeEach(() => {
    server.use(
      http.get(`${window.kirki_ecommerce.rest_url_base}${endpoints.ATTRIBUTES}`, () =>
        HttpResponse.json({
          success: true,
          message: '',
          data: { results: [], total: 0, per_page: 20 },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('binds a single window mouseup listener and removes it on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderUseBulkEditRow();

    expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    const [, boundHandler] = addSpy.mock.calls.find(([event]) => event === 'mouseup')!;

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mouseup', boundHandler);
  });
});
