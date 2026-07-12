type SortOrder = 'asc' | 'desc';

type ListFilter = {
  category_ids?: number[];
  brand_ids?: number[];
  collection_ids?: number[];
  tag_ids?: number[];
  status?: string | string[];
  stock_status?: string;
};

type ListState<TData = unknown> = {
  loaded: boolean;
  data: TData | null;
  search: string;
  page: number;
  sort_order: SortOrder;
  sort_by: string;
  limit: string | number;
  toggler?: boolean | number;
  filter?: ListFilter;
};

type ListQueryParams = {
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  page?: number;
  limit?: string | number;
};

export type { SortOrder, ListFilter, ListState, ListQueryParams };
