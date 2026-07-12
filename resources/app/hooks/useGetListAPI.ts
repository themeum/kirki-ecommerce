import { useEffect } from 'react';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import type { ListFilter, ListQueryParams, SortOrder } from '@/types';

type NestedTogglerState = {
  toggler?: boolean | number;
};

type ApiCallbackParams = ListQueryParams & ListFilter;

type AppThunk = (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
) => void;

type UseGetListAPIParams = {
  reducerName?: keyof RootState;
  apiCallBack: (params: ApiCallbackParams) => AppThunk;
  nestedToggler?: string[];
  limit?: string | number | false;
  page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  filter?: ListFilter;
};

const getNestedToggler = (
  slice: unknown,
  nestedToggler?: string[],
): boolean | number | undefined => {
  if (!nestedToggler?.length) {
    if (slice && typeof slice === 'object' && 'toggler' in slice) {
      return (slice as NestedTogglerState).toggler;
    }
    return undefined;
  }

  let current: unknown = slice;
  nestedToggler.forEach((key) => {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      current = undefined;
    }
  });

  if (current && typeof current === 'object' && 'toggler' in current) {
    return (current as NestedTogglerState).toggler;
  }

  return undefined;
};

const useGetListAPI = ({
  reducerName = 'categories',
  apiCallBack,
  nestedToggler,
  limit = false,
  page,
  search,
  sort_by,
  sort_order,
  filter,
}: UseGetListAPIParams) => {
  const slice = useAppSelector((state) => state[reducerName]);
  const listSlice =
    slice && typeof slice === 'object'
      ? (slice as {
          page?: number;
          search?: string;
          sort_by?: string;
          sort_order?: SortOrder;
          limit?: string | number;
          filter?: ListFilter;
        })
      : undefined;

  const _page = page ?? listSlice?.page;
  const _search = search ?? listSlice?.search;
  const _sort_by = sort_by ?? listSlice?.sort_by;
  const _sort_order = sort_order ?? listSlice?.sort_order;
  const toggler = getNestedToggler(slice, nestedToggler);
  const _limit = limit || listSlice?.limit;
  const _filter = filter || listSlice?.filter;
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      apiCallBack({
        search: _search,
        sort_by: _sort_by,
        sort_order: _sort_order,
        page: _page,
        limit: _limit,
        ...(_filter || {}),
      }),
    );
  }, [_search, _sort_by, _sort_order, _page, toggler, _filter]);
};

export default useGetListAPI;
