type SortOrder = 'asc' | 'desc';

type ListQueryParams = {
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  page?: number;
  limit?: string | number;
};

type ListParams<TFilter extends Record<string, unknown> = {}> =
  ListQueryParams & TFilter;

type ListState<
  TData = unknown,
  TFilter extends Record<string, unknown> = {},
> = {
  loaded: boolean;
  data: TData | null;
  search: string;
  page: number;
  sort_order: SortOrder;
  sort_by: string;
  limit: string | number;
  toggler?: boolean | number;
  filter?: TFilter;
};

type ListFilterParser<T = unknown> = {
  parse: (value: string | null) => T | undefined;
  serialize?: (value: T) => string | null;
};

type ListFilterConfig<TFilter extends Record<string, unknown>> = {
  keys: readonly (keyof TFilter & string)[];
  parsers: {
    [K in keyof TFilter]?: ListFilterParser<TFilter[K]>;
  };
};

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
const parseString = (value: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  return value;
};

const parseBoolean = (value: unknown): 0 | 1 => {
  if (!value) {
    return 0;
  }

  return Boolean(value) ? 1 : 0;
}

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



export type {
  ListFilterConfig,
  ListFilterParser,
  ListParams,
  ListQueryParams,
  ListState,
  SortOrder
};

export { parseBoolean, parseNumberArray, parseStatus, parseString, serializeFilterValue };

