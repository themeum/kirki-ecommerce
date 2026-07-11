import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import type { ListQueryParams, SortOrder } from '@/types';

type StoreSlice = {
  page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  limit?: string | number;
  filter?: Record<string, unknown>;
  toggler?: boolean | number;
  [key: string]: unknown;
};

type RootStateLike = Record<string, StoreSlice | undefined>;

type ApiCallbackParams = ListQueryParams & Record<string, unknown>;

type AppThunk = (
  dispatch: ThunkDispatch<RootStateLike, unknown, UnknownAction>,
) => void;

type UseGetListAPIParams = {
  reducerName?: string;
  apiCallBack: (params: ApiCallbackParams) => AppThunk;
  nestedToggler?: string[];
  limit?: string | number | false;
  page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  filter?: Record<string, unknown>;
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
  const _page =
    page ?? useSelector((state: RootStateLike) => state[reducerName]?.page);
  const _search =
    search ?? useSelector((state: RootStateLike) => state[reducerName]?.search);
  const _sort_by =
    sort_by ??
    useSelector((state: RootStateLike) => state[reducerName]?.sort_by);
  const _sort_order =
    sort_order ??
    useSelector((state: RootStateLike) => state[reducerName]?.sort_order);
  const toggler = useSelector((state: RootStateLike) => {
    if (!nestedToggler?.length) {
      return state[reducerName]?.toggler;
    }
    let current: unknown = state[reducerName];
    nestedToggler.forEach((key) => {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[key];
      } else {
        current = undefined;
      }
    });
    if (current && typeof current === 'object' && 'toggler' in current) {
      return (current as StoreSlice).toggler;
    }
    return undefined;
  });
  const _limit =
    limit || useSelector((state: RootStateLike) => state[reducerName]?.limit);
  const _filter =
    filter || useSelector((state: RootStateLike) => state[reducerName]?.filter);
  const dispatch =
    useDispatch<ThunkDispatch<RootStateLike, unknown, UnknownAction>>();
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
