type SortOrder = 'asc' | 'desc';

type ListState<TData = unknown> = {
  loaded: boolean;
  data: TData | null;
  search: string;
  page: number;
  sort_order: SortOrder;
  sort_by: string;
  limit: string | number;
  toggler?: boolean | number;
  filter?: Record<string, unknown>;
};

type ListQueryParams = {
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  page?: number;
  limit?: string | number;
};

export type { SortOrder, ListState, ListQueryParams };
