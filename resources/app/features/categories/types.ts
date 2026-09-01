import type { UseListParamsOptions } from '@/hooks/use-list-params';

const categoryListOptions: UseListParamsOptions = {
  defaults: {
    search: '',
    sort_by: 'id',
    sort_order: 'desc',
    page: 1,
    limit: 20,
  },
};

export { categoryListOptions };
