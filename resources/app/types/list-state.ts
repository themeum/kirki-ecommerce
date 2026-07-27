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

type ProductListFilter = {
  category_ids?: number[];
  brand_ids?: number[];
  collection_ids?: number[];
  status?: string | string[];
  stock_status?: string;
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

const productListFilterConfig: ListFilterConfig<ProductListFilter> = {
  keys: [
    'category_ids',
    'brand_ids',
    'collection_ids',
    'status',
    'stock_status',
  ],
  parsers: {
    category_ids: { parse: parseNumberArray },
    brand_ids: { parse: parseNumberArray },
    collection_ids: { parse: parseNumberArray },
    status: { parse: parseStatus },
    stock_status: { parse: parseString },
  },
};

export type {
  ListFilterConfig,
  ListFilterParser,
  ListParams,
  ListQueryParams,
  ListState,
  ProductListFilter,
  SortOrder,
};

export { productListFilterConfig, serializeFilterValue };
