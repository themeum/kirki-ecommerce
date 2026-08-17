import type { UseListParamsOptions } from '@/hooks/use-list-params';

const categoryListOptions: UseListParamsOptions = {
  defaults: {
    search: '',
    sort_by: 'name',
    sort_order: 'asc',
    page: 1,
    limit: 10,
  },
};

export { categoryListOptions };
