import type { UseListParamsOptions } from '@/hooks/use-list-params';
import type { ListFilterConfig } from '@/types/list-state';
import { parseString } from '@/types/list-state';

export type ReviewListFilter = {
  search?: string;
  status?: string;
};

export const reviewListFilterConfig: ListFilterConfig<ReviewListFilter> = {
  keys: ['search', 'status'],
  parsers: {
    search: { parse: parseString },
    status: { parse: parseString },
  },
};

export const reviewListOptions: UseListParamsOptions<ReviewListFilter> = {
  defaults: {
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: 20,
  },
  filter: reviewListFilterConfig,
};
