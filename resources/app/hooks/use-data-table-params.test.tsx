import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import useDataTableParams from '@/hooks/use-data-table-params';
import type { UseListParamsOptions } from '@/hooks/use-list-params';
import type { ListFilterConfig } from '@/types/list-state';

type TestFilter = { status?: string };

const filterConfig: ListFilterConfig<TestFilter> = {
  keys: ['status'],
  parsers: {
    status: { parse: (value) => value ?? undefined },
  },
};

const filterOptions: UseListParamsOptions<TestFilter> = {
  defaults: { search: '', sort_by: 'id', sort_order: 'asc', page: 1, limit: 10 },
  filter: filterConfig,
};

const renderUseDataTableParams = <TFilter extends Record<string, unknown> = {}>(
  options?: UseListParamsOptions<TFilter>,
  initialEntries: string[] = ['/'],
) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );

  return renderHook(() => useDataTableParams<TFilter>(options), { wrapper });
};

describe('useDataTableParams page-index conversion', () => {
  it('yields index 0 when the address holds no page', () => {
    const { result } = renderUseDataTableParams(undefined, ['/']);

    expect(result.current.pagination.pageIndex).toBe(0);
  });

  it('yields index 0 when the address holds page one', () => {
    const { result } = renderUseDataTableParams(undefined, ['/?page=1']);

    expect(result.current.pagination.pageIndex).toBe(0);
  });

  it('yields index 3 when the address holds page four', () => {
    const { result } = renderUseDataTableParams(undefined, ['/?page=4']);

    expect(result.current.pagination.pageIndex).toBe(3);
  });

  it('writes page four when the table reports index 3', () => {
    const { result } = renderUseDataTableParams();

    act(() => {
      result.current.onPaginationChange({ pageIndex: 3, pageSize: 10 });
    });

    expect(result.current.params.page).toBe(4);
    expect(result.current.pagination.pageIndex).toBe(3);
  });
});

describe('useDataTableParams sort conversion', () => {
  it('round-trips a sort request through the address', () => {
    const { result } = renderUseDataTableParams();

    act(() => {
      result.current.onSortingChange(() => [{ id: 'name', desc: true }]);
    });

    expect(result.current.params.sort_by).toBe('name');
    expect(result.current.params.sort_order).toBe('desc');
    expect(result.current.sorting).toEqual([{ id: 'name', desc: true }]);
  });
});

describe('useDataTableParams selectionResetKey', () => {
  it('changes when the search term changes', () => {
    const { result } = renderUseDataTableParams();
    const before = result.current.selectionResetKey;

    act(() => {
      result.current.setParam('search', 'shoes');
    });

    expect(result.current.selectionResetKey).not.toBe(before);
  });

  it('changes when a filter changes', () => {
    const { result } = renderUseDataTableParams(filterOptions);
    const before = result.current.selectionResetKey;

    act(() => {
      result.current.setParam('status', 'draft');
    });

    expect(result.current.selectionResetKey).not.toBe(before);
  });

  it('does not change when the page, limit or sort changes', () => {
    const { result } = renderUseDataTableParams();
    const before = result.current.selectionResetKey;

    act(() => {
      result.current.onPaginationChange({ pageIndex: 2, pageSize: 20 });
    });
    expect(result.current.selectionResetKey).toBe(before);

    act(() => {
      result.current.onSortingChange([{ id: 'name', desc: false }]);
    });
    expect(result.current.selectionResetKey).toBe(before);
  });
});

describe('useDataTableParams handler stability', () => {
  it('keeps handler identities across an address change', () => {
    const { result } = renderUseDataTableParams(filterOptions);
    const { onPaginationChange, onSortingChange } = result.current;

    act(() => {
      result.current.onPaginationChange({ pageIndex: 1, pageSize: 10 });
    });

    expect(result.current.onPaginationChange).toBe(onPaginationChange);
    expect(result.current.onSortingChange).toBe(onSortingChange);
  });
});
