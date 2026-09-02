import type { UseListParamsOptions } from '@/hooks/use-list-params';

const brandListOptions: UseListParamsOptions = {
  defaults: {
    search: '',
    sort_by: 'name',
    sort_order: 'asc',
    page: 1,
    limit: 20,
  },
};

export { brandListOptions };
