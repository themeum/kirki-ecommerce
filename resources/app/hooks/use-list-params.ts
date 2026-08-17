import { useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';

import type { ListFilterConfig, ListParams, ListQueryParams, SortOrder } from '@/types/list-state';
import { serializeFilterValue } from '@/types/list-state';

type ListParamsDefaults = ListQueryParams;

type ListParamsUpdate<
  TFilter extends Record<string, unknown> = {},
> = Partial<ListQueryParams & TFilter>;

type UseListParamsOptions<
  TFilter extends Record<string, unknown> = {},
> = {
  defaults?: ListParamsDefaults;
  filter?: ListFilterConfig<TFilter>;
};

type SetParamKey<TFilter extends Record<string, unknown>> =
  | keyof ListQueryParams
  | 'filter'
  | (keyof TFilter & string);

const useListParams = <
  TFilter extends Record<string, unknown> = {},
>(
  options: UseListParamsOptions<TFilter> = {},
) => {
  const {
    defaults = {
      search: '',
      sort_by: 'id',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
    filter: filterConfig,
  } = options;

  const filterKeys = useMemo(() => filterConfig?.keys ?? [], [filterConfig]);

  const [searchParams, setSearchParams] = useSearchParams();

  /*
   * react-router rebuilds `setSearchParams` on every URL change (its useCallback
   * closes over `searchParams`, and it feeds that stale copy to the functional
   * updater too). Reading it through a ref keeps the setters below stable, so
   * write-only consumers can subscribe to them without re-rendering on
   * navigation. Requires a stable `options` reference to be worth anything.
   */
  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;

  const params = useMemo((): ListParams<TFilter> => {
    const pageValue = searchParams.get('page');
    const limitValue = searchParams.get('limit');
    const sortOrder = searchParams.get('sort_order') as SortOrder | null;

    const parsedFilter: Partial<TFilter> = {};

    if (filterConfig) {
      filterConfig.keys.forEach((key) => {
        const raw = searchParams.get(key);
        const parser = filterConfig.parsers[key];
        const parsed = parser ? parser.parse(raw) : raw || undefined;

        if (parsed !== undefined) {
          (parsedFilter as Record<string, unknown>)[key] = parsed;
        }
      });
    }

    return {
      search: searchParams.get('search') ?? defaults.search ?? '',
      sort_by: searchParams.get('sort_by') ?? defaults.sort_by ?? 'id',
      sort_order: sortOrder ?? defaults.sort_order ?? 'asc',
      page: pageValue ? Number(pageValue) : (defaults.page ?? 1),
      limit: limitValue
        ? Number(limitValue) || limitValue
        : (defaults.limit ?? 10),
      ...parsedFilter,
    } as ListParams<TFilter>;
  }, [searchParams, defaults, filterConfig]);

  const serializeValue = useCallback(
    (key: string, value: unknown): string | null => {
      const parser = filterConfig?.parsers[key as keyof TFilter];

      if (parser?.serialize) {
        return parser.serialize(value as TFilter[keyof TFilter]);
      }

      return serializeFilterValue(value);
    },
    [filterConfig],
  );

  const setParams = useCallback(
    (updates: ListParamsUpdate<TFilter>, replace = false) => {
      setSearchParamsRef.current(
        (prev) => {
          const next = new URLSearchParams(prev);

          const shouldResetPage = Object.keys(updates).some((key) =>
            ['search', 'sort_by', 'sort_order', 'limit', ...filterKeys].includes(
              key,
            ),
          );

          Object.entries(updates).forEach(([key, value]) => {
            const serialized = serializeValue(key, value);
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
            if (filterKeys.includes(key)) {
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
    [defaults, filterKeys, serializeValue],
  );

  const setParam = useCallback(
    (key: SetParamKey<TFilter>, value: unknown, replace = false) => {
      if (key === 'filter' && value && typeof value === 'object') {
        setParams(value, replace);
        return;
      }
      setParams({ [key]: value } as ListParamsUpdate<TFilter>, replace);
    },
    [setParams],
  );

  const resetParams = useCallback(() => {
    setSearchParamsRef.current({}, { replace: true });
  }, []);

  return {
    params,
    setParam,
    setParams,
    resetParams,
    searchParams,
  };
};

export default useListParams;
export type { ListParamsDefaults, ListParamsUpdate, UseListParamsOptions };
