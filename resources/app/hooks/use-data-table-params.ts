import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { useCallback, useMemo, useRef } from 'react';

import type { ListParamsUpdate, UseListParamsOptions } from '@/hooks/use-list-params';
import useListParams from '@/hooks/use-list-params';

const useDataTableParams = <TFilter extends Record<string, unknown> = {}>(
  options: UseListParamsOptions<TFilter> = {},
) => {
  const { params, setParam, setParams } = useListParams<TFilter>(options);

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: Math.max((params.page ?? 1) - 1, 0),
      pageSize: Number(params.limit ?? 10),
    }),
    [params.page, params.limit],
  );

  const sorting = useMemo<SortingState>(() => {
    if (!params.sort_by) {
      return [];
    }

    return [{ id: params.sort_by, desc: params.sort_order === 'desc' }];
  }, [params.sort_by, params.sort_order]);

  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  const sortingRef = useRef(sorting);
  sortingRef.current = sorting;

  const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      const next =
        typeof updater === 'function' ? updater(paginationRef.current) : updater;

      setParams({ page: next.pageIndex + 1, limit: next.pageSize } as ListParamsUpdate<TFilter>);
    },
    [setParams],
  );

  const onSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const next = typeof updater === 'function' ? updater(sortingRef.current) : updater;
      const [nextSort] = next;

      if (!nextSort) {
        return;
      }

      setParams({ sort_by: nextSort.id, sort_order: nextSort.desc ? 'desc' : 'asc' } as ListParamsUpdate<TFilter>);
    },
    [setParams],
  );

  const selectionResetKey = useMemo(() => {
    const { page, limit, sort_by, sort_order, ...rest } = params;

    return JSON.stringify(rest);
  }, [params]);

  return {
    params,
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    setParam,
    setParams,
  };
};

export default useDataTableParams;
