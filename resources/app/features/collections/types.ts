import type { UseListParamsOptions } from '@/hooks/use-list-params';

const collectionListOptions: UseListParamsOptions = {
  defaults: {
    search: '',
    sort_by: 'title',
    sort_order: 'asc',
    page: 1,
    limit: 10,
  },
};

export { collectionListOptions };
