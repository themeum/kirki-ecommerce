import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { useCallback, useMemo, useRef } from 'react';

import type { DateRangeValue } from '@/components/ui/calendar';
import type { UseListParamsOptions } from '@/hooks/use-list-params';
import useListParams from '@/hooks/use-list-params';
import { formatDateValue } from '@/libs/date';
import { isDefined } from '@/utils/object';

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

      setParams({ page: next.pageIndex + 1, limit: next.pageSize });
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

      setParams({ sort_by: nextSort.id, sort_order: nextSort.desc ? 'desc' : 'asc' });
    },
    [setParams],
  );

  const selectionResetKey = useMemo(() => {
    const { page, limit, sort_by, sort_order, ...rest } = params;

    return JSON.stringify(rest);
  }, [params]);

  const handleDateFilter = useCallback((value: DateRangeValue | null) => {
    if (!isDefined(value) || !isDefined(value.from)) {
      setParams({
        from_date: null,
        to_date: null,
      });
      return;
    }

    setParams({
      from_date: formatDateValue(value.from),
      to_date: formatDateValue(!isDefined(value.to) ? value.from : value.to),
    });
  }, [setParams]);


  return {
    params,
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    setParam,
    setParams,
    handleDateFilter,
  };
};

export default useDataTableParams;
