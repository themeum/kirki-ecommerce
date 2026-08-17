import type { UseListParamsOptions } from '@/hooks/use-list-params';

const customerListOptions: UseListParamsOptions = {
  defaults: {
    search: '',
    sort_by: 'first_name',
    sort_order: 'asc',
    page: 1,
    limit: 10,
  },
};

export { customerListOptions };
