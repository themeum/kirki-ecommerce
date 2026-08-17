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

const parseArray = (value: string | null): string[] | undefined => {
  if (!value) {
    return undefined;
  }
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => Boolean(item));
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
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
};



export type {
  ListFilterConfig,
  ListFilterParser,
  ListParams,
  ListQueryParams,
  SortOrder,
};

export { parseArray, parseNumberArray, parseStatus, parseString, serializeFilterValue };

