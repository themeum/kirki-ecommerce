import type { UseListParamsOptions } from '@/hooks/use-list-params';
import type { ListFilterConfig } from '@/types/list-state';
import { parseString } from '@/types/list-state';

export type CustomerListFilter = {
  search?: string;
  country?: string;
  city?: string;
  from_date?: string | null;
  to_date?: string | null;
};

const customerListFilterConfig: ListFilterConfig<CustomerListFilter> = {
  keys: ['search', 'country', 'city'],
  parsers: {
    search: { parse: parseString },
    country: { parse: parseString },
    city: { parse: parseString },
  },
};

const customerListOptions: UseListParamsOptions<CustomerListFilter> = {
  defaults: {
    search: '',
    sort_by: 'id',
    sort_order: 'desc',
    page: 1,
    limit: 20,
  },
  filter: customerListFilterConfig,
};

export { customerListFilterConfig, customerListOptions };
