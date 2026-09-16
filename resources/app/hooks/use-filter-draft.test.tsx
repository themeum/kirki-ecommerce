import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import useFilterDraft from '@/hooks/use-filter-draft';
import type { UseListParamsOptions } from '@/hooks/use-list-params';
import type { ListFilterConfig } from '@/types/list-state';
import { parseNumberArray, parseString } from '@/types/list-state';

type TestFilter = {
  search?: string;
  status?: string;
  category_ids?: number[];
};

const filterConfig: ListFilterConfig<TestFilter> = {
  keys: ['search', 'status', 'category_ids'],
  parsers: {
    search: { parse: parseString },
    status: { parse: parseString },
    category_ids: { parse: parseNumberArray },
  },
};

const listOptions: UseListParamsOptions<TestFilter> = {
  defaults: { search: '', sort_by: 'id', sort_order: 'desc', page: 1, limit: 20 },
  filter: filterConfig,
};

type TestDraft = {
  status: string;
  category_ids: number[];
};

const emptyDraft: TestDraft = {
  status: 'all',
  category_ids: [],
};

const renderUseFilterDraft = (initialEntries: string[] = ['/']) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );

  return renderHook(() => useFilterDraft<TestFilter, TestDraft>(listOptions, emptyDraft), {
    wrapper,
  });
};

describe('useFilterDraft draft handling', () => {
  it('starts from the empty draft', () => {
    const { result } = renderUseFilterDraft(['/?status=draft']);

    expect(result.current.draft).toEqual(emptyDraft);
  });

  it('leaves the filters in force untouched while the draft is edited', () => {
    const { result } = renderUseFilterDraft(['/?status=draft']);

    act(() => {
      result.current.handleOpen();
    });
    act(() => {
      result.current.setDraftValue('status', 'published');
    });

    expect(result.current.draft.status).toBe('published');
    expect(result.current.params.status).toBe('draft');
  });

  it('discards the draft when the overlay is dismissed', () => {
    const { result } = renderUseFilterDraft(['/?status=draft']);

    act(() => {
      result.current.handleOpen();
    });
    act(() => {
      result.current.setDraftValue('status', 'published');
    });
    act(() => {
      result.current.handleClose();
    });

    expect(result.current.draft).toEqual(emptyDraft);
    expect(result.current.params.status).toBe('draft');
  });

  it('reseeds the draft from the filters in force when reopened', () => {
    const { result } = renderUseFilterDraft(['/?status=draft&category_ids=1,2']);

    act(() => {
      result.current.handleOpen();
    });

    expect(result.current.draft).toEqual({ status: 'draft', category_ids: [1, 2] });
  });

  it('seeds an unset filter with its empty value', () => {
    const { result } = renderUseFilterDraft(['/?status=draft']);

    act(() => {
      result.current.handleOpen();
    });

    expect(result.current.draft.category_ids).toEqual([]);
  });

  it('puts the draft into force on apply', () => {
    const { result } = renderUseFilterDraft();

    act(() => {
      result.current.setDraftValue('status', 'published');
    });
    act(() => {
      result.current.handleApply();
    });

    expect(result.current.params.status).toBe('published');
  });

  it('removes a filter returned to its empty value on apply', () => {
    const { result } = renderUseFilterDraft(['/?status=draft']);

    act(() => {
      result.current.handleOpen();
    });
    act(() => {
      result.current.setDraftValue('status', 'all');
    });
    act(() => {
      result.current.handleApply();
    });

    expect(result.current.params.status).toBeUndefined();
  });

  it('removes a multi-valued filter emptied on apply', () => {
    const { result } = renderUseFilterDraft(['/?category_ids=1,2']);

    act(() => {
      result.current.handleOpen();
    });
    act(() => {
      result.current.setDraftValue('category_ids', []);
    });
    act(() => {
      result.current.handleApply();
    });

    expect(result.current.params.category_ids).toBeUndefined();
  });
});

describe('useFilterDraft applied count', () => {
  it('reports no filters when none are in force', () => {
    const { result } = renderUseFilterDraft();

    expect(result.current.appliedCount).toBe(0);
  });

  it('counts a multi-valued filter once', () => {
    const { result } = renderUseFilterDraft(['/?category_ids=1,2,3,4,5,6']);

    expect(result.current.appliedCount).toBe(1);
  });

  it('counts each filter holding a value', () => {
    const { result } = renderUseFilterDraft(['/?status=draft&category_ids=1,2']);

    expect(result.current.appliedCount).toBe(2);
  });

  it('does not count a filter left at its empty value', () => {
    const { result } = renderUseFilterDraft(['/?status=all']);

    expect(result.current.appliedCount).toBe(0);
  });

  it('does not count filters outside the draft', () => {
    const { result } = renderUseFilterDraft(['/?search=shirt&from_date=2026-01-01']);

    expect(result.current.appliedCount).toBe(0);
  });
});

describe('useFilterDraft clearing', () => {
  it('removes every filter the draft governs', () => {
    const { result } = renderUseFilterDraft(['/?status=draft&category_ids=1,2']);

    act(() => {
      result.current.handleClear();
    });

    expect(result.current.params.status).toBeUndefined();
    expect(result.current.params.category_ids).toBeUndefined();
    expect(result.current.appliedCount).toBe(0);
  });

  it('resets the draft', () => {
    const { result } = renderUseFilterDraft(['/?status=draft']);

    act(() => {
      result.current.handleOpen();
    });
    act(() => {
      result.current.handleClear();
    });

    expect(result.current.draft).toEqual(emptyDraft);
  });

  it('leaves the search term and date range in force', () => {
    const { result } = renderUseFilterDraft(['/?status=draft&search=shirt&from_date=2026-01-01']);

    act(() => {
      result.current.handleClear();
    });

    expect(result.current.params.status).toBeUndefined();
    expect(result.current.params.search).toBe('shirt');
    expect(result.current.params.from_date).not.toBeNull();
  });
});
