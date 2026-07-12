import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import type { ListFilter, ListQueryParams, SortOrder } from '@/types';

type ListParamsDefaults = {
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  page?: number;
  limit?: string | number;
  filter?: ListFilter;
};

type UseListParamsOptions = {
  defaults?: ListParamsDefaults;
};

type SetParamKey =
  | keyof ListQueryParams
  | 'filter'
  | keyof ListFilter;

const FILTER_KEYS: Array<keyof ListFilter> = [
  'category_ids',
  'brand_ids',
  'collection_ids',
  'tag_ids',
  'status',
  'stock_status',
];

const parseNumberArray = (value: string | null): number[] | undefined => {
  if (!value) {
    return undefined;
  }
  const items = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => !Number.isNaN(item));
  if (!items.length) {
    return undefined;
  }
  return items;
};

const parseStatus = (value: string | null): string | string[] | undefined => {
  if (!value) {
    return undefined;
  }
  if (value.includes(',')) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return value;
};

const serializeFilterValue = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return null;
    }
    return value.join(',');
  }
  return String(value);
};

const useListParams = (options: UseListParamsOptions = {}) => {
  const {
    defaults = {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo((): ListQueryParams & ListFilter => {
    const pageValue = searchParams.get('page');
    const limitValue = searchParams.get('limit');
    const sortOrder = searchParams.get('sort_order') as SortOrder | null;

    const filter: ListFilter = {};
    const categoryIds = parseNumberArray(searchParams.get('category_ids'));
    const brandIds = parseNumberArray(searchParams.get('brand_ids'));
    const collectionIds = parseNumberArray(searchParams.get('collection_ids'));
    const tagIds = parseNumberArray(searchParams.get('tag_ids'));
    const status = parseStatus(searchParams.get('status'));
    const stockStatus = searchParams.get('stock_status');

    if (categoryIds) {
      filter.category_ids = categoryIds;
    }
    if (brandIds) {
      filter.brand_ids = brandIds;
    }
    if (collectionIds) {
      filter.collection_ids = collectionIds;
    }
    if (tagIds) {
      filter.tag_ids = tagIds;
    }
    if (status) {
      filter.status = status;
    }
    if (stockStatus) {
      filter.stock_status = stockStatus;
    }

    return {
      search: searchParams.get('search') ?? defaults.search ?? '',
      sort_by: searchParams.get('sort_by') ?? defaults.sort_by ?? 'name',
      sort_order: sortOrder ?? defaults.sort_order ?? 'asc',
      page: pageValue ? Number(pageValue) : (defaults.page ?? 1),
      limit: limitValue
        ? Number(limitValue) || limitValue
        : (defaults.limit ?? 10),
      ...filter,
    };
  }, [searchParams, defaults]);

  const setParams = useCallback(
    (updates: Partial<ListQueryParams & ListFilter>, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          const shouldResetPage = Object.keys(updates).some((key) =>
            ['search', 'sort_by', 'sort_order', ...FILTER_KEYS].includes(key),
          );

          Object.entries(updates).forEach(([key, value]) => {
            const serialized = serializeFilterValue(value);
            if (serialized === null) {
              next.delete(key);
              return;
            }
            next.set(key, serialized);
          });

          if (shouldResetPage && !('page' in updates)) {
            next.set('page', '1');
          }

          Object.entries(defaults).forEach(([key, defaultValue]) => {
            if (FILTER_KEYS.includes(key as keyof ListFilter)) {
              return;
            }
            const current = next.get(key);
            if (
              current !== null &&
              String(defaultValue) === current &&
              key !== 'page'
            ) {
              next.delete(key);
            }
          });

          if (next.get('page') === '1') {
            next.delete('page');
          }

          return next;
        },
        { replace },
      );
    },
    [defaults, setSearchParams],
  );

  const setParam = useCallback(
    (key: SetParamKey, value: unknown, replace = false) => {
      if (key === 'filter' && value && typeof value === 'object') {
        setParams(value as ListFilter, replace);
        return;
      }
      setParams({ [key]: value } as Partial<ListQueryParams & ListFilter>, replace);
    },
    [setParams],
  );

  const resetParams = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return {
    params,
    setParam,
    setParams,
    resetParams,
    searchParams,
  };
};

export default useListParams;
export type { ListParamsDefaults, UseListParamsOptions };
